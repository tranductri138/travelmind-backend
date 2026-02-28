import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiPropertyOptional({ description: 'Existing conversation ID (omit to create new)' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ description: 'User message content' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;
}
