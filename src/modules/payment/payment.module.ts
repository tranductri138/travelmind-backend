import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { StripeProvider } from './stripe.provider.js';
import { RefundProcessConsumer } from './consumers/refund-process.consumer.js';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, StripeProvider, RefundProcessConsumer],
  exports: [PaymentService],
})
export class PaymentModule {}
