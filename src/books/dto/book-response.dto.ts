// dto/book-response.dto.ts
import { NormalizedBookDto } from './normalized-book-dto';

type BookData = Pick<
  NormalizedBookDto,
  'isbn' | 'title' | 'author' | 'description' | 'pageCount' | 'coverUrl'
>;

export class BookResponseDto {
  isbn: string;
  title: string;
  author: string;
  description: string;
  pageCount: number;
  coverUrl: string;

  constructor(data: BookData) {
    this.isbn = data.isbn;
    this.title = data.title;
    this.author = data.author;
    this.description = data.description;
    this.pageCount = data.pageCount;
    this.coverUrl = data.coverUrl;
  }
}
