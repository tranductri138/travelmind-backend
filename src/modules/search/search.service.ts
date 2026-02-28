import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Client } from '@elastic/elasticsearch';
import { firstValueFrom } from 'rxjs';
import { ELASTICSEARCH_CLIENT } from './elasticsearch.provider.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SemanticSearchDto } from './dto/semantic-search.dto.js';
import { HOTEL_INDEX } from './indices/hotel.index.js';
import { PrismaService } from '../../core/database/prisma.service.js';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly aiServiceUrl: string;

  constructor(
    @Inject(ELASTICSEARCH_CLIENT) private readonly esClient: Client,
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

    // Try Elasticsearch first, fallback to PostgreSQL
    try {
      return await this.searchWithElasticsearch(q, city, country, page, limit);
    } catch (error) {
      this.logger.warn(
        `Elasticsearch unavailable, falling back to PostgreSQL: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return this.searchWithPostgres(q, city, country, page, limit);
    }
  }

  private async searchWithElasticsearch(
    q: string,
    city: string | undefined,
    country: string | undefined,
    page: number,
    limit: number,
  ) {
    const must: Record<string, unknown>[] = [
      {
        multi_match: {
          query: q,
          fields: ['name^3', 'description', 'city^2', 'address'],
          fuzziness: 'AUTO',
        },
      },
    ];

    const filter: Record<string, unknown>[] = [{ term: { isActive: true } }];
    if (city) filter.push({ term: { city } });
    if (country) filter.push({ term: { country } });

    const result = await this.esClient.search({
      index: HOTEL_INDEX,
      from: (page - 1) * limit,
      size: limit,
      query: { bool: { must, filter } as any },
      sort: ['_score', { rating: 'desc' }] as any,
    });

    const hits = result.hits.hits;
    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : ((result.hits.total as { value: number })?.value ?? 0);

    if (hits.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const scoreMap = new Map<string, number>();
    const hotelIds: string[] = [];
    for (const hit of hits) {
      const source = hit._source as Record<string, unknown>;
      const id = (source.id as string) || (hit._id as string);
      hotelIds.push(id);
      scoreMap.set(id, hit._score ?? 0);
    }

    const data = await this.enrichHotels(hotelIds, scoreMap, 'keyword');

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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

  private async enrichHotels(
    hotelIds: string[],
    scoreMap: Map<string, number>,
    source: 'keyword' | 'semantic',
  ) {
    const hotels = await this.prisma.hotel.findMany({
      where: { id: { in: hotelIds } },
      include: { rooms: true },
    });

    const hotelMap = new Map(hotels.map((h) => [h.id, h]));

    return hotelIds
      .filter((id) => hotelMap.has(id))
      .map((id) => {
        const hotel = hotelMap.get(id)!;
        const activeRooms = hotel.rooms.filter((r) => r.isActive);
        const priceMin = activeRooms.length
          ? Math.min(...activeRooms.map((r) => Number(r.price)))
          : 0;
        const { rooms, ...rest } = hotel;
        return {
          hotel: { ...rest, priceMin },
          score: scoreMap.get(id) ?? 0,
          source,
        };
      });
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
