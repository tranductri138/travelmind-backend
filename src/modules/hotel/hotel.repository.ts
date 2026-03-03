import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import { Prisma, Hotel } from '@prisma/client';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto.js';
import { SearchHotelDto } from './dto/search-hotel.dto.js';
import { NearbyQueryDto } from './dto/nearby-query.dto.js';

@Injectable()
export class HotelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<(Hotel & { priceMin: number }) | null> {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: { rooms: true },
    });
    if (!hotel) return null;
    const activeRooms = hotel.rooms.filter((r) => r.isActive);
    const priceMin =
      activeRooms.length > 0 ? Math.min(...activeRooms.map((r) => r.price)) : 0;
    return { ...hotel, priceMin };
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
    const minRating = dto.minRating ?? dto.rating;
    if (minRating) where.rating = { gte: minRating };
    if (dto.amenities?.length) where.amenities = { hasEvery: dto.amenities };

    // Price filter: hotels must have at least one active room in the price range
    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      const roomPriceFilter: Prisma.RoomWhereInput = { isActive: true };
      if (dto.minPrice !== undefined)
        roomPriceFilter.price = { gte: dto.minPrice };
      if (dto.maxPrice !== undefined) {
        roomPriceFilter.price = {
          ...((roomPriceFilter.price as Prisma.FloatFilter) || {}),
          lte: dto.maxPrice,
        };
      }
      where.rooms = { some: roomPriceFilter };
    }

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        include: { rooms: true },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    let hotelsWithPrice = hotels.map((hotel) => {
      const activeRooms = hotel.rooms.filter((r) => r.isActive);
      const priceMin =
        activeRooms.length > 0
          ? Math.min(...activeRooms.map((r) => r.price))
          : 0;
      const { rooms, ...rest } = hotel;
      return { ...rest, priceMin };
    });

    // Sort — frontend sends "rating:desc" or "priceMin:asc" in sort param
    let sortBy = dto.sortBy ?? dto.sort ?? 'rating';
    let sortOrder = dto.sortOrder || 'desc';
    if (sortBy.includes(':')) {
      const [field, order] = sortBy.split(':');
      sortBy = field;
      sortOrder = order === 'asc' ? 'asc' : 'desc';
    }
    const sortField = sortBy === 'price' ? 'priceMin' : sortBy;
    hotelsWithPrice.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortField];
      const bVal = (b as Record<string, unknown>)[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortOrder === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    // Paginate
    const skip = dto.skip ?? 0;
    const limit = dto.limit ?? 12;
    hotelsWithPrice = hotelsWithPrice.slice(skip, skip + limit);

    return new PaginatedResponseDto(
      hotelsWithPrice,
      total,
      dto.page,
      dto.limit,
    );
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
