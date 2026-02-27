import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service.js';
import { STRIPE_CLIENT } from './stripe.provider.js';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPaymentIntent(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (!payment) throw new BadRequestException('Payment not found');

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(payment.amount * 100),
      currency: payment.currency.toLowerCase(),
      metadata: { bookingId, paymentId: payment.id },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { stripePaymentId: paymentIntent.id },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret', '');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: PaymentStatus.SUCCEEDED, method: paymentIntent.payment_method as string },
        }),
        this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CONFIRMED },
        }),
      ]);

      this.eventEmitter.emit('booking.confirmed', { bookingId });
      this.logger.log(`Payment succeeded for booking: ${bookingId}`);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.prisma.payment.update({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: PaymentStatus.FAILED },
      });
    }
  }
}
