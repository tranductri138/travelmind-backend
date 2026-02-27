import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoomService } from './room.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { CheckAvailabilityDto } from './dto/check-availability.dto.js';
import { Public } from '../../shared/decorators/public.decorator.js';
import { Auth } from '../../shared/decorators/auth.decorator.js';

@ApiTags('Rooms')
@Controller('hotels/:hotelId/rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get rooms for a hotel' })
  async findByHotelId(@Param('hotelId') hotelId: string) {
    return this.roomService.findByHotelId(hotelId);
  }

  @Public()
  @Get(':roomId/availability')
  @ApiOperation({ summary: 'Check room availability' })
  async checkAvailability(
    @Param('roomId') roomId: string,
    @Query() dto: CheckAvailabilityDto,
  ) {
    const available = await this.roomService.checkAvailability(
      roomId,
      new Date(dto.checkIn),
      new Date(dto.checkOut),
    );
    return { available };
  }

  @Auth('ADMIN', 'HOTEL_OWNER')
  @Post()
  @ApiOperation({ summary: 'Create a room for a hotel' })
  async create(
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomService.create(hotelId, dto);
  }

  @Auth('ADMIN', 'HOTEL_OWNER')
  @Delete(':roomId')
  @ApiOperation({ summary: 'Soft delete a room' })
  async delete(@Param('roomId') roomId: string) {
    return this.roomService.delete(roomId);
  }

  @Auth('ADMIN')
  @Delete(':roomId/permanent')
  @ApiOperation({ summary: 'Permanently delete a room (Admin only)' })
  async hardDelete(@Param('roomId') roomId: string) {
    return this.roomService.hardDelete(roomId);
  }
}
