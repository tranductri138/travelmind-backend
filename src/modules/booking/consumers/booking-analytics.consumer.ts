import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';

@Injectable()
export class BookingAnalyticsConsumer extends BaseConsumer {
  async handleAnalytics(data: { bookingId: string }) {
    return this.handleWithRetry(data, async (msg) => {
      this.logger.log(`Tracking analytics for booking: ${msg.bookingId}`);
    });
  }
}
