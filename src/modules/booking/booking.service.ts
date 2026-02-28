import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingRepository } from './booking.repository.js';
import { BookingSaga } from './saga/booking.saga.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { BookingFilterDto } from './dto/booking-filter.dto.js';
import { BookingCreatedEvent } from './events/booking-created.event.js';
import { BookingCancelledEvent } from './events/booking-cancelled.event.js';
import { RoomService } from '../room/room.service.js';
import { Booking, BookingStatus } from '@prisma/client';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto.js';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly bookingSaga: BookingSaga,
    private readonly roomService: RoomService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    const booking = await this.bookingSaga.execute({
      userId,
      roomId: dto.roomId,
      checkIn,
      checkOut,
      guests: dto.guests || 1,
      totalPrice: dto.totalPrice,
      specialRequests: dto.specialRequests,
    });

    this.eventEmitter.emit(
      'booking.created',
      new BookingCreatedEvent(
        booking.id,
        userId,
        dto.roomId,
        checkIn,
        checkOut,
      ),
    );

    return booking;
  }

  async findById(id: string, userId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException();
    return booking;
  }

  async findByUser(
    userId: string,
    dto: BookingFilterDto,
  ): Promise<PaginatedResponseDto<Booking>> {
    return this.bookingRepository.findByUser(userId, dto);
  }

  async cancel(id: string, userId: string): Promise<Booking> {
    const booking = await this.findById(id, userId);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    const cancelled = await this.bookingRepository.updateStatus(
      id,
      BookingStatus.CANCELLED,
    );

    await this.roomService.releaseDates(
      booking.roomId,
      booking.checkIn,
      booking.checkOut,
    );

    this.eventEmitter.emit(
      'booking.cancelled',
      new BookingCancelledEvent(
        id,
        userId,
        booking.roomId,
        booking.checkIn,
        booking.checkOut,
      ),
    );

    return cancelled;
  }

  async delete(id: string, userId: string, userRole: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException();
    }
    if (booking.status === BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Cannot delete a confirmed booking, cancel it first',
      );
    }
    return this.bookingRepository.delete(id);
  }
}
