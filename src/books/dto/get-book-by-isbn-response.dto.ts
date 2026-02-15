import { GoogleBookItem } from './google-book-item.interface';

export class GetBookByISBNResponseDto {
  isbn: string;
  title: string;
  author: string;
  description: string;
  pageCount: number;
  coverUrl?: string;

  constructor(book: GoogleBookItem) {
    this.isbn =
      book.volumeInfo.industryIdentifiers[0].identifier ||
      book.volumeInfo.industryIdentifiers[1].identifier ||
      '';
    this.title = book.volumeInfo.title;
    this.author = book.volumeInfo.authors || '';
    this.description = book.volumeInfo.description || '';
    this.pageCount = book.volumeInfo.pageCount || 0;
    this.coverUrl = book.volumeInfo.imageLinks?.thumbnail || '';
  }
}
