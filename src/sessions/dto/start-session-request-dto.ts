import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class StartSessionRequestDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description: 'id of the book',
    example: 5,
  })
  bookId: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description: 'Session start page',
    example: 102,
  })
  startPage: number;
}
