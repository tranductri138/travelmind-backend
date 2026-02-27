import { Module } from '@nestjs/common';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { ElasticsearchProvider } from './elasticsearch.provider.js';

@Module({
  controllers: [SearchController],
  providers: [SearchService, ElasticsearchProvider],
  exports: [SearchService],
})
export class SearchModule {}
