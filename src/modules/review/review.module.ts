import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller.js';
import { ReviewService } from './review.service.js';
import { ReviewRepository } from './review.repository.js';
import { RatingAggregatorConsumer } from './consumers/rating-aggregator.consumer.js';
import { HotelModule } from '../hotel/hotel.module.js';

@Module({
  imports: [HotelModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository, RatingAggregatorConsumer],
  exports: [ReviewService],
})
export class ReviewModule {}
