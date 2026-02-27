import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-03-18' })
  @IsDateString()
  checkOut: string;
}
