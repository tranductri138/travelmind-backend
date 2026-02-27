import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HotelService } from './hotel.service.js';
import { CreateHotelDto } from './dto/create-hotel.dto.js';
import { UpdateHotelDto } from './dto/update-hotel.dto.js';
import { SearchHotelDto } from './dto/search-hotel.dto.js';
import { NearbyQueryDto } from './dto/nearby-query.dto.js';
import { Public } from '../../shared/decorators/public.decorator.js';
import { Auth } from '../../shared/decorators/auth.decorator.js';
import { ApiPaginated } from '../../shared/decorators/api-paginated.decorator.js';

@ApiTags('Hotels')
@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search hotels with filters' })
  @ApiPaginated()
  async search(@Query() dto: SearchHotelDto) {
    return this.hotelService.search(dto);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find hotels near a location' })
  async findNearby(@Query() dto: NearbyQueryDto) {
    return this.hotelService.findNearby(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get hotel details' })
  async findById(@Param('id') id: string) {
    return this.hotelService.findById(id);
  }

  @Auth('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Create a new hotel (Admin only)' })
  async create(@Body() dto: CreateHotelDto) {
    return this.hotelService.create(dto);
  }

  @Auth('ADMIN', 'HOTEL_OWNER')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a hotel' })
  async update(@Param('id') id: string, @Body() dto: UpdateHotelDto) {
    return this.hotelService.update(id, dto);
  }

  @Auth('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a hotel (Admin only)' })
  async delete(@Param('id') id: string) {
    return this.hotelService.delete(id);
  }

  @Auth('ADMIN')
  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a hotel (Admin only)' })
  async hardDelete(@Param('id') id: string) {
    return this.hotelService.hardDelete(id);
  }
}
