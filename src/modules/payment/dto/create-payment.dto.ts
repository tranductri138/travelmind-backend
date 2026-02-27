import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  bookingId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;
}
