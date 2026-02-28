import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { EXCHANGE_NAME } from '../../shared/constants/queue.constants.js';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: AmqpConnectionManager;
  private channel: ChannelWrapper;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>(
      'rabbitmq.url',
      'amqp://guest:guest@localhost:5672',
    );

    this.connection = connect([url]);

    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`RabbitMQ disconnected: ${err?.message}`),
    );

    this.channel = this.connection.createChannel({
      json: true,
      setup: async (ch: import('amqplib').Channel) => {
        await ch.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        this.logger.log(`Exchange "${EXCHANGE_NAME}" (topic) asserted`);
      },
    });

    await this.channel.waitForConnect();
  }

  async publish(routingKey: string, data: unknown): Promise<void> {
    try {
      await this.channel.publish(EXCHANGE_NAME, routingKey, data, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });
      this.logger.debug(`Published ${routingKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish ${routingKey}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch {
      // ignore close errors during shutdown
    }
  }
}
