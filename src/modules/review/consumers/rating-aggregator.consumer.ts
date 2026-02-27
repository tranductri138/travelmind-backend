import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';

@Injectable()
export class RatingAggregatorConsumer extends BaseConsumer {
  async handleRatingUpdate(data: { hotelId: string }) {
    return this.handleWithRetry(data, async (msg) => {
      this.logger.log(`Aggregating ratings for hotel: ${msg.hotelId}`);
    });
  }
}
