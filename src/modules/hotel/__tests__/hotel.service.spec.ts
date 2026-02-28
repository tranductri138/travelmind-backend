import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HotelService } from '../hotel.service.js';
import { HotelRepository } from '../hotel.repository.js';

describe('HotelService', () => {
  let service: HotelService;

  const mockHotelRepository = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    search: jest.fn(),
    findNearby: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateRating: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        { provide: HotelRepository, useValue: mockHotelRepository },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<HotelService>(HotelService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return hotel if found', async () => {
      const hotel = { id: '1', name: 'Test Hotel', slug: 'test-hotel' };
      mockHotelRepository.findById.mockResolvedValue(hotel);
      const result = await service.findById('1');
      expect(result).toEqual(hotel);
    });

    it('should throw NotFoundException', async () => {
      mockHotelRepository.findById.mockResolvedValue(null);
      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create hotel with slug and emit event', async () => {
      const hotel = {
        id: '1',
        name: 'Grand Hotel',
        slug: 'grand-hotel',
        city: 'HCMC',
      };
      mockHotelRepository.create.mockResolvedValue(hotel);

      const result = await service.create({
        name: 'Grand Hotel',
        address: '123 Street',
        city: 'HCMC',
        country: 'Vietnam',
      });

      expect(result).toEqual(hotel);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'hotel.created',
        expect.objectContaining({ hotelId: '1' }),
      );
    });
  });
});
