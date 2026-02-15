import { IsString } from 'class-validator';

export class GetBookByISBNRequestDto {
  @IsString()
  isbn: string;
}
