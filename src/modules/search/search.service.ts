import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SemanticSearchDto } from './dto/semantic-search.dto.js';
import { PrismaService } from '../../core/database/prisma.service.js';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.aiServiceUrl = this.config.get<string>(
      'ai.serviceUrl',
      'http://localhost:8000',
    );
  }

  async searchHotels(dto: SearchQueryDto) {
    const { q, city, country, page = 1, limit = 10 } = dto;
    return this.searchWithPostgres(q, city, country, page, limit);
  }

  private async searchWithPostgres(
    q: string,
    city: string | undefined,
    country: string | undefined,
    page: number,
    limit: number,
  ) {
    const where: Record<string, unknown> = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ],
    };
    if (city) (where as any).city = { equals: city, mode: 'insensitive' };
    if (country)
      (where as any).country = { equals: country, mode: 'insensitive' };

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where: where as any,
        include: { rooms: true },
        orderBy: { rating: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.hotel.count({ where: where as any }),
    ]);

    const data = hotels.map((hotel) => {
      const activeRooms = hotel.rooms.filter((r) => r.isActive);
      const priceMin = activeRooms.length
        ? Math.min(...activeRooms.map((r) => Number(r.price)))
        : 0;
      const { rooms, ...rest } = hotel;
      return {
        hotel: { ...rest, priceMin },
        score: 1,
        source: 'keyword' as const,
      };
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async unifiedSearch(dto: SearchQueryDto) {
    const { q, page = 1, limit = 10 } = dto;

    const [keywordResult, semanticResult] = await Promise.allSettled([
      this.searchHotels(dto),
      this.semanticSearch({
        query: q,
        city: dto.city,
        country: dto.country,
        limit,
      }),
    ]);

    const keywordData =
      keywordResult.status === 'fulfilled' ? keywordResult.value.data : [];
    const semanticData =
      semanticResult.status === 'fulfilled'
        ? Array.isArray(semanticResult.value)
          ? semanticResult.value
          : ((semanticResult.value as any).data ?? [])
        : [];

    if (keywordResult.status === 'rejected') {
      this.logger.warn(`Keyword search failed: ${keywordResult.reason}`);
    }
    if (semanticResult.status === 'rejected') {
      this.logger.warn(`Semantic search failed: ${semanticResult.reason}`);
    }

    // Merge: semantic first, then keyword, deduplicate by hotel.id
    const seen = new Set<string>();
    const merged: typeof keywordData = [];

    for (const item of semanticData) {
      if (!seen.has(item.hotel.id)) {
        seen.add(item.hotel.id);
        merged.push(item);
      }
    }
    for (const item of keywordData) {
      if (!seen.has(item.hotel.id)) {
        seen.add(item.hotel.id);
        merged.push(item);
      }
    }

    const total = merged.length;
    const totalPages = Math.ceil(total / limit);
    const paged = merged.slice((page - 1) * limit, page * limit);

    return {
      data: paged,
      meta: { total, page, limit, totalPages },
    };
  }

  async semanticSearch(dto: SemanticSearchDto) {
    try {
      const { data: aiResponse } = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/ai/search`, dto),
      );

      const results: { hotel_id: string; score: number }[] =
        aiResponse?.results ?? [];

      if (results.length === 0) {
        return { data: [] };
      }

      // Fetch full hotel data from DB
      const hotelIds = results.map((r) => r.hotel_id);
      const hotels = await this.prisma.hotel.findMany({
        where: { id: { in: hotelIds }, isActive: true },
        include: { rooms: true },
      });

      const hotelMap = new Map(hotels.map((h) => [h.id, h]));

      const data = results
        .filter((r) => hotelMap.has(r.hotel_id))
        .map((r) => {
          const hotel = hotelMap.get(r.hotel_id)!;
          const minPrice = hotel.rooms.length
            ? Math.min(...hotel.rooms.map((rm) => Number(rm.price)))
            : 0;
          return {
            hotel: {
              id: hotel.id,
              name: hotel.name,
              description: hotel.description,
              address: hotel.address,
              city: hotel.city,
              country: hotel.country,
              stars: hotel.stars,
              rating: hotel.rating ? Number(hotel.rating) : 0,
              reviewCount: hotel.reviewCount,
              latitude: hotel.latitude ? Number(hotel.latitude) : null,
              longitude: hotel.longitude ? Number(hotel.longitude) : null,
              amenities: hotel.amenities,
              images: hotel.images,
              priceMin: minPrice,
            },
            score: r.score,
            source: 'semantic' as const,
          };
        });

      return data;
    } catch (error) {
      this.logger.error(
        `Semantic search failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return [];
    }
  }
}
