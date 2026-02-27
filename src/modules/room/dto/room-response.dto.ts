import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() hotelId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() type: string;
  @ApiProperty() price: number;
  @ApiProperty() currency: string;
  @ApiProperty() maxGuests: number;
  @ApiProperty() amenities: string[];
  @ApiProperty() images: string[];
  @ApiProperty() isActive: boolean;
}
