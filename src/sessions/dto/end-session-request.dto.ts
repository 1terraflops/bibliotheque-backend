import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNumber, IsPositive } from 'class-validator';

export class EndSessionRequestDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description: 'id of the book',
    example: 5,
  })
  id: number;

  @IsISO8601()
  @ApiProperty({
    description: 'Session start time',
    type: String,
    nullable: true,
  })
  startedAt: string;

  @IsISO8601()
  @ApiProperty({
    description: 'Session finish time',
    type: String,
  })
  finishedAt: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description: 'Session start page',
    type: Number,
    nullable: true,
  })
  startPage: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description: 'Session end page',
    type: Number,
  })
  endPage: number;
}
