import { Controller, Post, Param, Req, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service.js';
import { Public } from '../../shared/decorators/public.decorator.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth()
  @Post('intent/:bookingId')
  @ApiOperation({ summary: 'Create a payment intent' })
  async createIntent(@Param('bookingId') bookingId: string) {
    return this.paymentService.createPaymentIntent(bookingId);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook' })
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    await this.paymentService.handleWebhook(signature, req.rawBody!);
    return { received: true };
  }
}
