import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomRepository } from './room.repository.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { Room } from '@prisma/client';

@Injectable()
export class RoomService {
  constructor(private readonly roomRepository: RoomRepository) {}

  async findByHotelId(hotelId: string): Promise<Room[]> {
    return this.roomRepository.findByHotelId(hotelId);
  }

  async findById(id: string): Promise<Room> {
    const room = await this.roomRepository.findById(id);
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async create(hotelId: string, dto: CreateRoomDto): Promise<Room> {
    return this.roomRepository.create(hotelId, {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      price: dto.price,
      currency: dto.currency || 'USD',
      maxGuests: dto.maxGuests || 2,
      amenities: dto.amenities || [],
      images: dto.images || [],
    });
  }

  async delete(id: string): Promise<Room> {
    await this.findById(id);
    return this.roomRepository.delete(id);
  }

  async hardDelete(id: string): Promise<Room> {
    await this.findById(id);
    return this.roomRepository.hardDelete(id);
  }

  async checkAvailability(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<boolean> {
    return this.roomRepository.checkAvailability(roomId, checkIn, checkOut);
  }

  async blockDates(roomId: string, checkIn: Date, checkOut: Date): Promise<void> {
    return this.roomRepository.blockDates(roomId, checkIn, checkOut);
  }

  async releaseDates(roomId: string, checkIn: Date, checkOut: Date): Promise<void> {
    return this.roomRepository.releaseDates(roomId, checkIn, checkOut);
  }
}
