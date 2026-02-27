import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReviewRepository } from './review.repository.js';
import { HotelService } from '../hotel/hotel.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ReviewCreatedEvent } from './events/review-created.event.js';
import { ReviewDeletedEvent } from './events/review-deleted.event.js';
import { Review } from '@prisma/client';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto.js';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly hotelService: HotelService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByHotelId(
    hotelId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<Review>> {
    return this.reviewRepository.findByHotelId(hotelId, page, limit);
  }

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const existing = await this.reviewRepository.findByUserAndHotel(
      userId,
      dto.hotelId,
    );
    if (existing) {
      throw new ConflictException('You have already reviewed this hotel');
    }

    await this.hotelService.findById(dto.hotelId);

    const review = await this.reviewRepository.create({
      userId,
      hotelId: dto.hotelId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
    });

    await this.hotelService.updateRating(dto.hotelId);

    this.eventEmitter.emit(
      'review.created',
      new ReviewCreatedEvent(review.id, dto.hotelId, dto.rating),
    );

    return review;
  }

  async delete(id: string, userId: string, userRole: string): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException();
    }

    const deleted = await this.reviewRepository.delete(id);
    await this.hotelService.updateRating(review.hotelId);

    this.eventEmitter.emit(
      'review.deleted',
      new ReviewDeletedEvent(review.id, review.hotelId),
    );

    return deleted;
  }
}
