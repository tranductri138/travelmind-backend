import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrawlerController } from './crawler.controller.js';
import { CrawlerService } from './crawler.service.js';

@Module({
  imports: [HttpModule],
  controllers: [CrawlerController],
  providers: [CrawlerService],
})
export class CrawlerModule {}
