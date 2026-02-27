import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { BookingFilterDto } from './dto/booking-filter.dto.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { ApiPaginated } from '../../shared/decorators/api-paginated.decorator.js';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user bookings' })
  @ApiPaginated()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() dto: BookingFilterDto,
  ) {
    return this.bookingService.findByUser(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingService.findById(id, userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingService.cancel(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a booking (owner or admin)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingService.delete(id, userId, userRole);
  }
}
