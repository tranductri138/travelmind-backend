import { Global, Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service.js';

@Global()
@Module({})
export class RabbitMQModule {
  static forRoot(): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: 'RABBITMQ_SERVICE',
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [config.get<string>('rabbitmq.url', 'amqp://guest:guest@localhost:5672')],
                queue: 'travelmind.main',
                queueOptions: {
                  durable: true,
                  deadLetterExchange: 'travelmind.dlx',
                  deadLetterRoutingKey: 'failed',
                  messageTtl: 30000,
                },
                prefetchCount: 10,
                noAck: false,
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      providers: [RabbitMQService],
      exports: [ClientsModule, RabbitMQService],
      global: true,
    };
  }
}
