import { IsString } from 'class-validator';

export class AddBookByISBNRequestDto {
  @IsString()
  isbn: string;
}
