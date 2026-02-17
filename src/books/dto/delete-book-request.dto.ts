import { IsString, Matches } from 'class-validator';

export class DeleteBookRequestDto {
  @IsString()
  @Matches(/^(?:\d{10}|\d{13})$/, {
    message: 'ISBN must be either 10 or 13 digits',
  })
  isbn: string;
}
