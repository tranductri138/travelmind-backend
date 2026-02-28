import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReviewService } from '../review.service.js';
import { ReviewRepository } from '../review.repository.js';
import { HotelService } from '../../hotel/hotel.service.js';

describe('ReviewService', () => {
  let service: ReviewService;

  const mockReviewRepository = {
    findByHotelId: jest.fn(),
    create: jest.fn(),
    findByUserAndHotel: jest.fn(),
  };

  const mockHotelService = {
    findById: jest.fn(),
    updateRating: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: ReviewRepository, useValue: mockReviewRepository },
        { provide: HotelService, useValue: mockHotelService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if already reviewed', async () => {
      mockReviewRepository.findByUserAndHotel.mockResolvedValue({ id: 'r-1' });

      await expect(
        service.create('user-1', { hotelId: 'h-1', rating: 5 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create review and update rating', async () => {
      mockReviewRepository.findByUserAndHotel.mockResolvedValue(null);
      mockHotelService.findById.mockResolvedValue({ id: 'h-1' });
      const review = { id: 'r-1', hotelId: 'h-1', rating: 5 };
      mockReviewRepository.create.mockResolvedValue(review);
      mockHotelService.updateRating.mockResolvedValue(undefined);

      const result = await service.create('user-1', {
        hotelId: 'h-1',
        rating: 5,
      });
      expect(result).toEqual(review);
      expect(mockHotelService.updateRating).toHaveBeenCalledWith('h-1');
    });
  });
});
