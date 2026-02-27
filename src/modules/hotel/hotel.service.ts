import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HotelRepository } from './hotel.repository.js';
import { CreateHotelDto } from './dto/create-hotel.dto.js';
import { UpdateHotelDto } from './dto/update-hotel.dto.js';
import { SearchHotelDto } from './dto/search-hotel.dto.js';
import { NearbyQueryDto } from './dto/nearby-query.dto.js';
import { HotelCreatedEvent } from './events/hotel-created.event.js';
import { HotelUpdatedEvent } from './events/hotel-updated.event.js';
import { HotelDeletedEvent } from './events/hotel-deleted.event.js';
import { generateSlug } from '../../shared/utils/slug.util.js';
import { Hotel } from '@prisma/client';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto.js';

@Injectable()
export class HotelService {
  constructor(
    private readonly hotelRepository: HotelRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findById(id: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findById(id);
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async search(dto: SearchHotelDto): Promise<PaginatedResponseDto<Hotel>> {
    return this.hotelRepository.search(dto);
  }

  async findNearby(dto: NearbyQueryDto): Promise<Hotel[]> {
    return this.hotelRepository.findNearby(dto);
  }

  async create(dto: CreateHotelDto): Promise<Hotel> {
    const slug = generateSlug(dto.name);
    const hotel = await this.hotelRepository.create({
      ...dto,
      slug,
      stars: dto.stars ?? 0,
      amenities: dto.amenities ?? [],
      images: dto.images ?? [],
    });

    this.eventEmitter.emit(
      'hotel.created',
      new HotelCreatedEvent(hotel.id, hotel.name, hotel.city),
    );

    return hotel;
  }

  async update(id: string, dto: UpdateHotelDto): Promise<Hotel> {
    await this.findById(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.name) data.slug = generateSlug(dto.name);
    const hotel = await this.hotelRepository.update(id, data);

    this.eventEmitter.emit(
      'hotel.updated',
      new HotelUpdatedEvent(hotel.id, hotel.name, hotel.city),
    );

    return hotel;
  }

  async delete(id: string): Promise<Hotel> {
    const hotel = await this.findById(id);
    const deleted = await this.hotelRepository.delete(id);

    this.eventEmitter.emit(
      'hotel.deleted',
      new HotelDeletedEvent(hotel.id, false),
    );

    return deleted;
  }

  async hardDelete(id: string): Promise<Hotel> {
    const hotel = await this.findById(id);
    const deleted = await this.hotelRepository.hardDelete(id);

    this.eventEmitter.emit(
      'hotel.deleted',
      new HotelDeletedEvent(hotel.id, true),
    );

    return deleted;
  }

  async updateRating(hotelId: string): Promise<void> {
    return this.hotelRepository.updateRating(hotelId);
  }
}
