import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../core/database/prisma.service.js';
import { HotelCreatedEvent } from '../hotel/events/hotel-created.event.js';
import { generateSlug } from '../../shared/utils/slug.util.js';
import { CrawlJob, CrawlStatus } from '@prisma/client';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.aiServiceUrl = this.config.get<string>(
      'ai.serviceUrl',
      'http://localhost:8000',
    );
  }

  async triggerCrawl(url: string, extractReviews: boolean): Promise<CrawlJob> {
    const job = await this.prisma.crawlJob.create({
      data: { url, extractReviews, status: CrawlStatus.PENDING },
    });

    // Process in background — don't await
    this.processCrawlJob(job.id, url, extractReviews).catch((err) => {
      this.logger.error(
        `Background crawl failed for job ${job.id}: ${err instanceof Error ? err.message : 'Unknown'}`,
      );
    });

    return job;
  }

  private async processCrawlJob(
    jobId: string,
    url: string,
    extractReviews: boolean,
  ): Promise<void> {
    await this.prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: CrawlStatus.RUNNING },
    });

    try {
      const { data: scrapeResult } = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/scraping/extract`, {
          url,
          extract_reviews: extractReviews,
        }),
      );

      const hotelData = scrapeResult.hotel;
      if (!hotelData?.name) {
        throw new Error('AI extraction returned no hotel name');
      }

      const slug = generateSlug(hotelData.name);

      const hotel = await this.prisma.hotel.create({
        data: {
          name: hotelData.name,
          slug,
          description: hotelData.description || null,
          address: hotelData.address || 'N/A',
          city: hotelData.city || 'Unknown',
          country: hotelData.country || 'Unknown',
          stars: hotelData.stars ?? 0,
          amenities: hotelData.amenities ?? [],
          images: hotelData.images ?? [],
          contactEmail: hotelData.contact_email || null,
          contactPhone: hotelData.contact_phone || null,
        },
      });

      await this.prisma.crawlJob.update({
        where: { id: jobId },
        data: {
          status: CrawlStatus.COMPLETED,
          hotelId: hotel.id,
          result: scrapeResult as object,
        },
      });

      this.eventEmitter.emit(
        'hotel.created',
        new HotelCreatedEvent(hotel.id, hotel.name, hotel.city),
      );

      this.logger.log(
        `Crawl job ${jobId} completed — created hotel "${hotel.name}" (${hotel.id})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Crawl job ${jobId} failed: ${message}`);

      await this.prisma.crawlJob.update({
        where: { id: jobId },
        data: { status: CrawlStatus.FAILED, error: message },
      });
    }
  }

  async listJobs(
    page: number,
    limit: number,
  ): Promise<{
    data: CrawlJob[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const [data, total] = await Promise.all([
      this.prisma.crawlJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.crawlJob.count(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getJob(id: string): Promise<CrawlJob | null> {
    return this.prisma.crawlJob.findUnique({ where: { id } });
  }
}
