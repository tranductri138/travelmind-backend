import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service.js';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async initiatePayment(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });
    if (!payment) throw new BadRequestException('Payment not found for this booking');

    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Payment already completed');
    }

    const transactionId = `LL-${randomUUID()}`;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { transactionId },
    });

    return {
      transactionId,
      amount: payment.amount,
      currency: payment.currency,
      bankInfo: {
        bankName: 'LianLian Bank',
        accountNumber: '8800-1234-5678-9999',
        accountHolder: 'TravelMind International Ltd.',
        routingCode: 'LLBKVN2X',
      },
    };
  }

  async confirmPayment(transactionId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
    });

    if (!payment) throw new NotFoundException('Transaction not found');

    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Payment already confirmed');
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCEEDED, method: 'lianlian_bank' },
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: BookingStatus.CONFIRMED },
      }),
    ]);

    this.eventEmitter.emit('booking.confirmed', { bookingId: payment.bookingId });
    this.logger.log(`LianLian Bank payment confirmed for booking: ${payment.bookingId}`);

    return { status: 'SUCCEEDED', bookingId: payment.bookingId };
  }
}
