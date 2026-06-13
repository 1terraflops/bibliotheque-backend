import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BookResponseDto } from 'src/books/dto/books/book-response.dto';

export class GetReviewsResponseDto {
  @Expose()
  @ApiProperty({ description: 'ID of the review', example: 12 })
  id!: number;

  @Expose()
  @ApiProperty({
    description: 'The review of the book',
    example: 'Great book, recommend it',
  })
  review!: string;

  @Expose()
  @ApiProperty({
    description: 'Does this review contain spoilers?',
    example: true,
    default: false,
  })
  hasSpoilers!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Date of review',
    example: '2026-02-18T00:00:00.000Z',
  })
  createdAt!: string;

  @Expose()
  @ApiProperty({ description: 'Info about reviewed book' })
  @Type(() => BookResponseDto)
  book!: BookResponseDto;
}
