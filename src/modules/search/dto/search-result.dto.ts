import { ApiProperty } from '@nestjs/swagger';

export class SearchResultDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() city: string;
  @ApiProperty() country: string;
  @ApiProperty() rating: number;
  @ApiProperty() score: number;
}
