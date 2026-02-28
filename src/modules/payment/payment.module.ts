import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { RefundProcessConsumer } from './consumers/refund-process.consumer.js';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, RefundProcessConsumer],
  exports: [PaymentService],
})
export class PaymentModule {}
