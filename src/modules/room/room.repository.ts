import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import { Room, Prisma } from '@prisma/client';

@Injectable()
export class RoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByHotelId(hotelId: string): Promise<Room[]> {
    return this.prisma.room.findMany({
      where: { hotelId, isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async findById(id: string): Promise<Room | null> {
    return this.prisma.room.findUnique({ where: { id } });
  }

  async create(
    hotelId: string,
    data: Prisma.RoomCreateWithoutHotelInput,
  ): Promise<Room> {
    return this.prisma.room.create({
      data: { ...data, hotel: { connect: { id: hotelId } } },
    });
  }

  async delete(id: string): Promise<Room> {
    return this.prisma.room.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<Room> {
    return this.prisma.room.delete({ where: { id } });
  }

  async checkAvailability(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<boolean> {
    const unavailable = await this.prisma.roomAvailability.count({
      where: {
        roomId,
        date: { gte: checkIn, lt: checkOut },
        isAvailable: false,
      },
    });
    return unavailable === 0;
  }

  async blockDates(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<void> {
    const dates: Date[] = [];
    const current = new Date(checkIn);
    while (current < checkOut) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    await this.prisma.$transaction(
      dates.map((date) =>
        this.prisma.roomAvailability.upsert({
          where: { roomId_date: { roomId, date } },
          update: { isAvailable: false },
          create: { roomId, date, isAvailable: false },
        }),
      ),
    );
  }

  async releaseDates(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<void> {
    await this.prisma.roomAvailability.updateMany({
      where: {
        roomId,
        date: { gte: checkIn, lt: checkOut },
      },
      data: { isAvailable: true },
    });
  }
}
