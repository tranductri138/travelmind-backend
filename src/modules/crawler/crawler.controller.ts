import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service.js';
import { TriggerCrawlDto } from './dto/trigger-crawl.dto.js';
import { Auth } from '../../shared/decorators/auth.decorator.js';

@ApiTags('Crawler')
@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Auth('ADMIN')
  @Post('trigger')
  @ApiOperation({ summary: 'Trigger a URL crawl job (Admin only)' })
  async trigger(@Body() dto: TriggerCrawlDto) {
    return this.crawlerService.triggerCrawl(
      dto.url,
      dto.extractReviews ?? false,
    );
  }

  @Auth('ADMIN')
  @Get('jobs')
  @ApiOperation({ summary: 'List crawl jobs (Admin only)' })
  async listJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.crawlerService.listJobs(
      Number(page) || 1,
      Math.min(Number(limit) || 10, 100),
    );
  }

  @Auth('ADMIN')
  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get crawl job detail (Admin only)' })
  async getJob(@Param('id') id: string) {
    const job = await this.crawlerService.getJob(id);
    if (!job) throw new NotFoundException('Crawl job not found');
    return job;
  }
}
