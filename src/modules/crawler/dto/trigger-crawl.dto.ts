import { IsString, IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TriggerCrawlDto {
  @ApiProperty({ example: 'https://www.booking.com/hotel/vn/example.html' })
  @IsString()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  extractReviews?: boolean;
}
