import { IsString, IsOptional, IsNumber, IsArray, IsInt, Min, Max, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty({ example: 'Grand Palace Hotel' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A luxurious hotel in the heart of the city' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Vietnam' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: 10.762622 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 106.660172 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @ApiPropertyOptional({ example: ['wifi', 'pool', 'gym'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: ['https://example.com/image.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: 'contact@hotel.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+84123456789' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}
