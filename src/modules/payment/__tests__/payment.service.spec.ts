import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentService } from '../payment.service.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { STRIPE_CLIENT } from '../stripe.provider.js';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

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

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: STRIPE_CLIENT, useValue: mockStripe },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should throw if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.createPaymentIntent('booking-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create payment intent', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'p-1',
        amount: 100,
        currency: 'USD',
      });
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test',
        client_secret: 'cs_test',
      });
      mockPrisma.payment.update.mockResolvedValue({});

      const result = await service.createPaymentIntent('booking-1');
      expect(result).toHaveProperty('clientSecret', 'cs_test');
    });
  });
});
