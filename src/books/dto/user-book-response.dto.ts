import { Expose, Transform, Type } from 'class-transformer';
import { BookResponseDto } from './book-response.dto';
import { BookStatus } from 'generated/prisma/enums';

const dateTransform = ({ value }: { value: Date | string | null }) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
};

export class UserBookResponseDto {
  @Expose()
  status: BookStatus;

  @Expose()
  pagesRead: number;

  @Expose()
  @Transform(dateTransform)
  startedAt: string | null;

  @Expose()
  @Transform(dateTransform)
  finishedAt: string | null;

  @Expose()
  @Transform(dateTransform)
  updatedAt: string | null;

  @Expose()
  rating: number | null;

  @Expose()
  isFavorite: boolean;

  @Expose()
  @Type(() => BookResponseDto)
  book: BookResponseDto;
}
