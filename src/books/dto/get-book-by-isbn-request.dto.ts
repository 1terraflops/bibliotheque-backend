import { IsISBN } from 'class-validator';

export class GetBookByISBNRequestDto {
  @IsISBN()
  isbn: string;
}
