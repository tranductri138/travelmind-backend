import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';

@Injectable()
export class HotelIndexingConsumer extends BaseConsumer {
  async handleIndexing(data: { hotelId: string }) {
    return this.handleWithRetry(data, async (msg) => {
      this.logger.log(`Indexing hotel: ${msg.hotelId}`);
    });
  }
}
