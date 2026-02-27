import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';

@Injectable()
export class RefundProcessConsumer extends BaseConsumer {
  async handleRefund(data: { paymentId: string; amount: number }) {
    return this.handleWithRetry(data, async (msg) => {
      this.logger.log(`Processing refund for payment: ${msg.paymentId}`);
    });
  }
}
