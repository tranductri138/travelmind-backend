import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentService } from '../payment.service.js';
import { PrismaService } from '../../../core/database/prisma.service.js';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPrisma = {
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('should throw if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.initiatePayment('booking-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate transactionId and return bank info', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'p-1',
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        booking: { id: 'booking-1' },
      });
      mockPrisma.payment.update.mockResolvedValue({});

      const result = await service.initiatePayment('booking-1');
      expect(result.transactionId).toMatch(/^LL-/);
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('USD');
      expect(result.bankInfo.bankName).toBe('LianLian Bank');
    });

    it('should throw if payment already succeeded', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'p-1',
        amount: 100,
        currency: 'USD',
        status: 'SUCCEEDED',
      });
      await expect(service.initiatePayment('booking-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirmPayment', () => {
    it('should throw if transaction not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.confirmPayment('LL-invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should confirm payment and emit event', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'p-1',
        bookingId: 'booking-1',
        status: 'PENDING',
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.confirmPayment('LL-test-123');
      expect(result.status).toBe('SUCCEEDED');
      expect(result.bookingId).toBe('booking-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('booking.confirmed', {
        bookingId: 'booking-1',
      });
    });
  });
});
