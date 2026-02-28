import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SemanticSearchDto } from './dto/semantic-search.dto.js';
import { Public } from '../../shared/decorators/public.decorator.js';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Unified search (keyword + semantic) for hotels' })
  async search(@Query() dto: SearchQueryDto) {
    return this.searchService.unifiedSearch(dto);
  }

  @Public()
  @Post('semantic')
  @ApiOperation({ summary: 'Semantic search for hotels via AI' })
  async semanticSearch(@Body() dto: SemanticSearchDto) {
    return this.searchService.semanticSearch(dto);
  }
}
