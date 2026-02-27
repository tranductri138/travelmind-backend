import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';

@Injectable()
export class BookingNotificationConsumer extends BaseConsumer {
  async handleBookingNotification(data: { bookingId: string; userId: string }) {
    return this.handleWithRetry(data, async (msg) => {
      this.logger.log(`Sending booking notification for: ${msg.bookingId}`);
    });
  }
}
