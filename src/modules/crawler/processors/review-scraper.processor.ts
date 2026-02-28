import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReviewScraperProcessor {
  private readonly logger = new Logger(ReviewScraperProcessor.name);

  async scrape(
    hotelId: string,
  ): Promise<{ rating: number; text: string; source: string }[]> {
    this.logger.log(`Scraping reviews for hotel: ${hotelId}`);
    return [];
  }
}
