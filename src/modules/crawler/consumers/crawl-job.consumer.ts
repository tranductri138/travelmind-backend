import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '../../../core/queue/consumers/base.consumer.js';

@Injectable()
export class CrawlJobConsumer extends BaseConsumer {
  async handleCrawlJob(data: { hotelId: string; type: string }) {
    return this.handleWithRetry(data, async (msg) => {
      this.logger.log(
        `Processing crawl job: ${msg.type} for hotel: ${msg.hotelId}`,
      );
    });
  }
}
