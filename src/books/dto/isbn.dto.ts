import { IsISBN } from 'class-validator';

export class isbnDto {
  @IsISBN()
  isbn: string;
}
