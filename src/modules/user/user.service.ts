import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findById(id);
    return this.userRepository.update(id, dto);
  }

  async delete(id: string): Promise<User> {
    await this.findById(id);
    return this.userRepository.delete(id);
  }
}
