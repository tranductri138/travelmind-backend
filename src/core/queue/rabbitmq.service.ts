import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RabbitMQService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {}

  async publish(pattern: string, data: unknown): Promise<void> {
    this.client.emit(pattern, data);
  }

  async send<T>(pattern: string, data: unknown): Promise<T> {
    return lastValueFrom(this.client.send<T>(pattern, data));
  }
}
