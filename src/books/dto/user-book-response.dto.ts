import { Expose, Transform, Type } from 'class-transformer';
import { BookResponseDto } from './book-response.dto';
import { BookStatus } from 'generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

const dateTransform = ({ value }: { value: Date | string | null }) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
};

export class UserBookResponseDto {
  @Expose()
  @ApiProperty({
    example: BookStatus.IN_PROGRESS,
    enum: BookStatus,
  })
  status: BookStatus;

  @Expose()
  @ApiProperty({
    example: 15,
  })
  actualPageCount: number;

  @Expose()
  @ApiProperty({
    example: 15,
  })
  pagesRead: number;

  @Expose()
  @ApiProperty({
    example: '2026-02-18T00:00:00.000Z',
    type: String,
  })
  @Transform(dateTransform)
  startedAt: string | null;

  @Expose()
  @ApiProperty({
    example: '2026-02-18T00:00:00.000Z',
    type: String,
  })
  @Transform(dateTransform)
  finishedAt: string | null;

  @Expose()
  @ApiProperty({
    example: '2026-02-18T00:00:00.000Z',
    type: String,
  })
  @Transform(dateTransform)
  updatedAt: string | null;

  @Expose()
  @ApiProperty({
    example: 5,
    type: Number,
  })
  rating: number | null;

  @Expose()
  @ApiProperty({
    example: true,
  })
  isFavorite: boolean;

  @Expose()
  @ApiProperty({
    description: 'Spent time reading in minutes',
    example: 45,
  })
  spentTime: number;

  @Expose()
  @ApiProperty({
    example: 15,
  })
  readingSpeed: number;

  @Expose()
  @ApiProperty({
    description: 'Estimated time reading in minutes',
    example: 320,
  })
  estimatedTime: number | null;

  @Expose()
  @ApiProperty()
  @Type(() => BookResponseDto)
  book: BookResponseDto;
}
