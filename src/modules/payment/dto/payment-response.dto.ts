import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() bookingId: string;
  @ApiPropertyOptional() stripePaymentId?: string;
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: Date;
}
