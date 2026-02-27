import { Injectable, Inject, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ELASTICSEARCH_CLIENT } from './elasticsearch.provider.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { HOTEL_INDEX } from './indices/hotel.index.js';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(ELASTICSEARCH_CLIENT) private readonly esClient: Client,
  ) {}

  async searchHotels(dto: SearchQueryDto) {
    const { q, city, country, page = 1, limit = 10 } = dto;

    const must: Record<string, unknown>[] = [
      {
        multi_match: {
          query: q,
          fields: ['name^3', 'description', 'city^2', 'address'],
          fuzziness: 'AUTO',
        },
      },
    ];

    const filter: Record<string, unknown>[] = [
      { term: { isActive: true } },
    ];

    if (city) filter.push({ term: { city } });
    if (country) filter.push({ term: { country } });

    try {
      const result = await this.esClient.search({
        index: HOTEL_INDEX,
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: { must, filter } as any,
        },
        sort: ['_score', { rating: 'desc' }] as any,
      });

      const hits = result.hits.hits.map((hit) => ({
        ...(hit._source as Record<string, unknown>),
        score: hit._score,
      }));

      const total =
        typeof result.hits.total === 'number'
          ? result.hits.total
          : (result.hits.total as { value: number })?.value ?? 0;

      return {
        data: hits,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  }
}
