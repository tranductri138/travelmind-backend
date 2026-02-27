import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller.js';
import { CrawlerService } from './crawler.service.js';
import { PriceScraperProcessor } from './processors/price-scraper.processor.js';
import { ReviewScraperProcessor } from './processors/review-scraper.processor.js';
import { CrawlJobConsumer } from './consumers/crawl-job.consumer.js';

@Module({
  controllers: [CrawlerController],
  providers: [
    CrawlerService,
    PriceScraperProcessor,
    ReviewScraperProcessor,
    CrawlJobConsumer,
  ],
})
export class CrawlerModule {}
