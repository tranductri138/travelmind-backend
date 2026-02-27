import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HotelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiProperty()
  stars: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  reviewCount: number;

  @ApiProperty()
  amenities: string[];

  @ApiProperty()
  images: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
