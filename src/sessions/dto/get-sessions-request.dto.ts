import { ApiProperty } from '@nestjs/swagger';
import { IsISBN, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetSessionsRequestDto {
  @IsISBN()
  @ApiProperty({
    description: 'The ISBN of the book',
    example: '9786175480083',
  })
  isbn!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    description: 'Id of the last session. Use for pagination',
    example: 12,
    required: false,
  })
  cursor?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    description: 'Number of sessions to return',
    example: 20,
    default: 20,
    required: false,
  })
  take?: number = 20;
}
