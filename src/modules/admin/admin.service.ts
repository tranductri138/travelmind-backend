import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';

export interface DashboardStats {
  totalHotels: number;
  totalBookings: number;
  totalUsers: number;
  totalReviews: number;
  revenue: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalHotels,
      totalBookings,
      totalUsers,
      totalReviews,
      revenueResult,
    ] = await Promise.all([
      this.prisma.hotel.count({ where: { isActive: true } }),
      this.prisma.booking.count(),
      this.prisma.user.count(),
      this.prisma.review.count(),
      this.prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      }),
    ]);

    return {
      totalHotels,
      totalBookings,
      totalUsers,
      totalReviews,
      revenue: revenueResult._sum.totalPrice || 0,
    };
  }
}
