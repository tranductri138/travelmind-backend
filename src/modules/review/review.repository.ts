import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import { Review, Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto.js';

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByHotelId(
    hotelId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<Review>> {
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = { hotelId };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return new PaginatedResponseDto(reviews, total, page, limit);
  }

  async create(data: Prisma.ReviewUncheckedCreateInput): Promise<Review> {
    return this.prisma.review.create({ data });
  }

  async findById(id: string): Promise<Review | null> {
    return this.prisma.review.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<Review> {
    return this.prisma.review.delete({ where: { id } });
  }

  async findByUserAndHotel(
    userId: string,
    hotelId: string,
  ): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { userId_hotelId: { userId, hotelId } },
    });
  }
}
