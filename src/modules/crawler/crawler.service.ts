import { Injectable, Logger } from '@nestjs/common';
import { PriceScraperProcessor } from './processors/price-scraper.processor.js';
import { ReviewScraperProcessor } from './processors/review-scraper.processor.js';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly priceScraper: PriceScraperProcessor,
    private readonly reviewScraper: ReviewScraperProcessor,
  ) {}

  async triggerPriceCrawl(hotelId: string) {
    this.logger.log(`Triggering price crawl for hotel: ${hotelId}`);
    return this.priceScraper.scrape(hotelId);
  }

  async triggerReviewCrawl(hotelId: string) {
    this.logger.log(`Triggering review crawl for hotel: ${hotelId}`);
    return this.reviewScraper.scrape(hotelId);
  }

  getStatus() {
    return { status: 'idle', lastRun: null, nextRun: null };
  }
}
