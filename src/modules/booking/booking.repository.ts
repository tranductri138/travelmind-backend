import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto.js';
import { BookingFilterDto } from './dto/booking-filter.dto.js';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Booking | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { hotel: true } }, payment: true },
    });
  }

  async findByUser(
    userId: string,
    dto: BookingFilterDto,
  ): Promise<PaginatedResponseDto<Booking>> {
    const where: Prisma.BookingWhereInput = { userId };
    if (dto.status) where.status = dto.status as BookingStatus;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: { room: { include: { hotel: true } }, payment: true },
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return new PaginatedResponseDto(bookings, total, dto.page, dto.limit);
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    return this.prisma.booking.update({ where: { id }, data: { status } });
  }

  async delete(id: string): Promise<Booking> {
    return this.prisma.booking.delete({ where: { id } });
  }
}
