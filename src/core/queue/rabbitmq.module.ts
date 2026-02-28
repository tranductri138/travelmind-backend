import { Global, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service.js';
import { EventBridgeService } from './event-bridge.service.js';

@Global()
@Module({
  providers: [RabbitMQService, EventBridgeService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
