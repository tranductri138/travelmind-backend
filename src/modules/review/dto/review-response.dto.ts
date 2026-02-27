import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() hotelId: string;
  @ApiProperty() rating: number;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() comment?: string;
  @ApiProperty() createdAt: Date;
}
