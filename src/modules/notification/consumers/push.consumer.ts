import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';
import { NotificationService } from '../notification.service.js';

@Injectable()
export class PushConsumer extends BaseConsumer {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async handlePush(data: { userId: string; title: string; body: string }) {
    return this.handleWithRetry(data, async (msg) => {
      await this.notificationService.sendPushNotification(
        msg.userId,
        msg.title,
        msg.body,
      );
    });
  }
}
