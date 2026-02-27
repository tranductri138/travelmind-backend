import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() roomId: string;
  @ApiProperty() checkIn: Date;
  @ApiProperty() checkOut: Date;
  @ApiProperty() guests: number;
  @ApiProperty() totalPrice: number;
  @ApiProperty() currency: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() specialRequests?: string;
  @ApiProperty() createdAt: Date;
}
