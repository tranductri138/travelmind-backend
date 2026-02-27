import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import { Prisma, Hotel } from '@prisma/client';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto.js';
import { SearchHotelDto } from './dto/search-hotel.dto.js';
import { NearbyQueryDto } from './dto/nearby-query.dto.js';

@Injectable()
export class HotelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Hotel | null> {
    return this.prisma.hotel.findUnique({
      where: { id },
      include: { rooms: true },
    });
  }

  async findBySlug(slug: string): Promise<Hotel | null> {
    return this.prisma.hotel.findUnique({ where: { slug } });
  }

  async search(dto: SearchHotelDto): Promise<PaginatedResponseDto<Hotel>> {
    const where: Prisma.HotelWhereInput = { isActive: true };

    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
        { city: { contains: dto.q, mode: 'insensitive' } },
      ];
    }
    if (dto.city) where.city = { equals: dto.city, mode: 'insensitive' };
    if (dto.country)
      where.country = { equals: dto.country, mode: 'insensitive' };
    if (dto.minStars) where.stars = { gte: dto.minStars };
    if (dto.minRating) where.rating = { gte: dto.minRating };
    if (dto.amenities?.length) where.amenities = { hasEvery: dto.amenities };

    const orderBy: Prisma.HotelOrderByWithRelationInput = {};
    if (dto.sortBy) {
      (orderBy as Record<string, string>)[dto.sortBy] = dto.sortOrder || 'desc';
    } else {
      orderBy.rating = 'desc';
    }

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return new PaginatedResponseDto(hotels, total, dto.page, dto.limit);
  }

  async findNearby(dto: NearbyQueryDto): Promise<Hotel[]> {
    const radiusKm = dto.radius || 10;
    const hotels = await this.prisma.$queryRaw<Hotel[]>`
      SELECT * FROM (
        SELECT *, (
          6371 * acos(
            cos(radians(${dto.lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${dto.lng})) +
            sin(radians(${dto.lat})) * sin(radians(latitude))
          )
        ) AS distance
        FROM hotels
        WHERE is_active = true
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
      ) AS nearby
      WHERE distance <= ${radiusKm}
      ORDER BY distance
      LIMIT 20
    `;
    return hotels;
  }

  async create(data: Prisma.HotelCreateInput): Promise<Hotel> {
    return this.prisma.hotel.create({ data });
  }

  async update(id: string, data: Prisma.HotelUpdateInput): Promise<Hotel> {
    return this.prisma.hotel.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Hotel> {
    return this.prisma.hotel.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<Hotel> {
    return this.prisma.hotel.delete({ where: { id } });
  }

  async updateRating(hotelId: string): Promise<void> {
    const result = await this.prisma.review.aggregate({
      where: { hotelId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        rating: result._avg.rating || 0,
        reviewCount: result._count.rating,
      },
    });
  }
}
