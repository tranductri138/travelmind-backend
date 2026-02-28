import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from '../user.service.js';
import { UserRepository } from '../user.repository.js';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      const user = { id: '1', email: 'test@test.com', firstName: 'Test' };
      mockUserRepository.findById.mockResolvedValue(user);

      const result = await service.findById('1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return user', async () => {
      const user = { id: '1', email: 'test@test.com', firstName: 'Test' };
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue({
        ...user,
        firstName: 'Updated',
      });

      const result = await service.updateProfile('1', { firstName: 'Updated' });
      expect(result.firstName).toBe('Updated');
    });
  });
});
