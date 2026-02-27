import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service.js';
import { Auth } from '../../shared/decorators/auth.decorator.js';

@ApiTags('Crawler')
@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Auth('ADMIN')
  @Post('trigger')
  @ApiOperation({ summary: 'Trigger a crawl job (Admin only)' })
  async trigger(@Body() body: { hotelId: string; type: 'price' | 'review' }) {
    if (body.type === 'price') {
      return this.crawlerService.triggerPriceCrawl(body.hotelId);
    }
    return this.crawlerService.triggerReviewCrawl(body.hotelId);
  }

  @Auth('ADMIN')
  @Get('status')
  @ApiOperation({ summary: 'Get crawler status' })
  async getStatus() {
    return this.crawlerService.getStatus();
  }
}
