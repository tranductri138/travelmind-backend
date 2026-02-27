import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { EmailConsumer } from './consumers/email.consumer.js';
import { PushConsumer } from './consumers/push.consumer.js';

@Module({
  providers: [NotificationService, EmailConsumer, PushConsumer],
  exports: [NotificationService],
})
export class NotificationModule {}
