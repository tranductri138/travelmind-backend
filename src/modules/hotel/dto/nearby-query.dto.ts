import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NearbyQueryDto {
  @ApiProperty({ example: 10.762622 })
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 106.660172 })
  @Type(() => Number)
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: 10, description: 'Radius in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number = 10;
}
