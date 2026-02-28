import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { RoomService } from '../../room/room.service.js';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingSaga {
  private readonly logger = new Logger(BookingSaga.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
  ) {}

  async execute(params: {
    userId: string;
    roomId: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    totalPrice: number;
    specialRequests?: string;
  }) {
    const isAvailable = await this.roomService.checkAvailability(
      params.roomId,
      params.checkIn,
      params.checkOut,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'Room is not available for the selected dates',
      );
    }

    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        const newBooking = await tx.booking.create({
          data: {
            userId: params.userId,
            roomId: params.roomId,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            guests: params.guests,
            totalPrice: params.totalPrice,
            specialRequests: params.specialRequests,
            status: BookingStatus.PENDING,
          },
        });

        await tx.payment.create({
          data: {
            bookingId: newBooking.id,
            amount: params.totalPrice,
            currency: 'USD',
          },
        });

        return newBooking;
      });

      await this.roomService.blockDates(
        params.roomId,
        params.checkIn,
        params.checkOut,
      );

      this.logger.log(`Booking saga completed: ${booking.id}`);
      return booking;
    } catch (error) {
      this.logger.error(
        `Booking saga failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
