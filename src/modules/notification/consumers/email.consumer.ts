import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';
import { NotificationService } from '../notification.service.js';

@Injectable()
export class EmailConsumer extends BaseConsumer {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async handleEmail(data: { to: string; template: string; context: Record<string, unknown> }) {
    return this.handleWithRetry(data, async (msg) => {
      await this.notificationService.sendEmail(msg.to, msg.template, msg.context);
    });
  }
}
