import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { BookStatus } from 'generated/prisma/enums';

export class UpdateBookRequestDto {
  @ApiProperty({
    description: 'Reading status',
    example: 'IN_PROGRESS',
    enum: BookStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @ApiProperty({
    description: 'Date when user started reading this book',
    example: '2026-02-18T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiProperty({
    description: 'Total number of read pages',
    example: 56,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  pagesRead?: number;

  @ApiProperty({
    description: "User's rating of the book (1-5)",
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'Did user favorite this book?',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
