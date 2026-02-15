import { GoogleBookItem } from './google-book-item.interface';

export class GetBookResponseDto {
  isbn: string;
  title: string;
  author: string;
  description: string;
  pageCount: number;
  coverUrl: string;

  constructor(book: GoogleBookItem) {
    this.isbn =
      book.volumeInfo.industryIdentifiers[1].identifier ||
      book.volumeInfo.industryIdentifiers[0].identifier ||
      '';
    this.title = book.volumeInfo.title;
    this.author = Array.isArray(book.volumeInfo.authors)
      ? book.volumeInfo.authors.join(', ')
      : book.volumeInfo.authors || '';
    this.description = book.volumeInfo.description || '';
    this.pageCount = book.volumeInfo.pageCount || 0;
    this.coverUrl = book.volumeInfo.imageLinks?.thumbnail || '';
  }
}
