import { IsISBN } from 'class-validator';

export class AddBookByISBNRequestDto {
  @IsISBN()
  isbn: string;
}
