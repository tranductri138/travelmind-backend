import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PriceScraperProcessor {
  private readonly logger = new Logger(PriceScraperProcessor.name);

  async scrape(hotelId: string): Promise<{ price: number; source: string }[]> {
    this.logger.log(`Scraping prices for hotel: ${hotelId}`);
    return [];
  }
}
