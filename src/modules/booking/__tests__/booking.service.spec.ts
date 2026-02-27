import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingService } from '../booking.service.js';
import { BookingRepository } from '../booking.repository.js';
import { BookingSaga } from '../saga/booking.saga.js';
import { RoomService } from '../../room/room.service.js';

describe('BookingService', () => {
  let service: BookingService;

  const mockBookingRepository = {
    findById: jest.fn(),
    findByUser: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockBookingSaga = {
    execute: jest.fn(),
  };

  const mockRoomService = {
    releaseDates: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: BookingRepository, useValue: mockBookingRepository },
        { provide: BookingSaga, useValue: mockBookingSaga },
        { provide: RoomService, useValue: mockRoomService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if checkOut is before checkIn', async () => {
      await expect(
        service.create('user-1', {
          roomId: 'room-1',
          checkIn: '2026-04-18',
          checkOut: '2026-04-15',
          totalPrice: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create booking via saga', async () => {
      const booking = { id: 'b-1', userId: 'user-1', roomId: 'room-1' };
      mockBookingSaga.execute.mockResolvedValue(booking);

      const result = await service.create('user-1', {
        roomId: 'room-1',
        checkIn: '2026-04-15',
        checkOut: '2026-04-18',
        totalPrice: 300,
      });

      expect(result).toEqual(booking);
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should throw if booking not found', async () => {
      mockBookingRepository.findById.mockResolvedValue(null);
      await expect(service.cancel('b-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
