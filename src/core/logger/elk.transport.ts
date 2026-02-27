import * as net from 'net';
import { ConfigService } from '@nestjs/config';

export class ElkTransport {
  private client: net.Socket | null = null;
  private host: string;
  private port: number;
  private connected = false;

  constructor(configService: ConfigService) {
    this.host = configService.get<string>('elk.logstashHost', 'localhost');
    this.port = configService.get<number>('elk.logstashPort', 5044);
  }

  connect(): void {
    this.client = new net.Socket();
    this.client.connect(this.port, this.host, () => {
      this.connected = true;
    });
    this.client.on('error', () => {
      this.connected = false;
    });
    this.client.on('close', () => {
      this.connected = false;
    });
  }

  send(logEntry: Record<string, unknown>): void {
    if (this.connected && this.client) {
      this.client.write(JSON.stringify(logEntry) + '\n');
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.destroy();
      this.connected = false;
    }
  }
}
