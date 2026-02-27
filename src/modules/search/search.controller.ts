import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { Public } from '../../shared/decorators/public.decorator.js';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Full-text search for hotels' })
  async search(@Query() dto: SearchQueryDto) {
    return this.searchService.searchHotels(dto);
  }
}
