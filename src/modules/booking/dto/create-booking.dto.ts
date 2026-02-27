import { IsString, IsDateString, IsInt, IsOptional, Min, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-03-18' })
  @IsDateString()
  checkOut: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  guests?: number;

  @ApiProperty({ example: 450.00 })
  @IsNumber()
  totalPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
