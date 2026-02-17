import { Expose } from 'class-transformer';

export class BookResponseDto {
  @Expose()
  isbn: string;

  @Expose()
  title: string;

  @Expose()
  author: string;

  @Expose()
  description: string;

  @Expose()
  pageCount: number;

  @Expose()
  coverUrl: string;
}
