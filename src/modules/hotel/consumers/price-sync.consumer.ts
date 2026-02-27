import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';

@Injectable()
export class PriceSyncConsumer extends BaseConsumer {
  async handlePriceSync(data: { hotelId: string; price: number }) {
    return this.handleWithRetry(data, async (msg) => {
      this.logger.log(`Processing price sync for hotel: ${msg.hotelId}`);
    });
  }
}
