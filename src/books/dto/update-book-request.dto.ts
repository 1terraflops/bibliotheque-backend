import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
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

  @ApiProperty({
    description: 'The actual number of pages in the book',
    example: 356,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  actualPageCount?: number;
}
