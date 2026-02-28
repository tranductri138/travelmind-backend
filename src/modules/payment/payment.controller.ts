import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service.js';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate/:bookingId')
  @ApiOperation({ summary: 'Initiate a LianLian Bank payment for a booking' })
  async initiatePayment(@Param('bookingId') bookingId: string) {
    return this.paymentService.initiatePayment(bookingId);
  }

  @Post('confirm/:transactionId')
  @ApiOperation({ summary: 'Confirm a LianLian Bank payment (simulated)' })
  async confirmPayment(@Param('transactionId') transactionId: string) {
    return this.paymentService.confirmPayment(transactionId);
  }
}
