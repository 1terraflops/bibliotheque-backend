import { GoogleBookItem } from './google-book-item.interface';

export class NormalizedBookDto {
  isbn: string;
  title: string;
  author: string;
  description: string;
  pageCount: number;
  coverUrl: string;

  constructor(book: GoogleBookItem) {
    const identifiers = book.volumeInfo?.industryIdentifiers ?? [];

    const isbn13 = identifiers.find((id) => id.type === 'ISBN_13')?.identifier;
    const isbn10 = identifiers.find((id) => id.type === 'ISBN_10')?.identifier;

    this.isbn = isbn13 || isbn10 || '';

    this.title = book.volumeInfo?.title || '';

    this.author = Array.isArray(book.volumeInfo?.authors)
      ? book.volumeInfo.authors.join(', ')
      : book.volumeInfo?.authors || '';

    this.description = book.volumeInfo?.description || '';
    this.pageCount = book.volumeInfo?.pageCount || 0;
    this.coverUrl = book.volumeInfo?.imageLinks?.thumbnail || '';
  }
}
