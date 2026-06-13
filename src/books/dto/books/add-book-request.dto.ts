import { ApiProperty } from '@nestjs/swagger';
import { IsISBN } from 'class-validator';

export class AddBookByISBNRequestDto {
  @ApiProperty({
    description: 'The ISBN of the book',
    example: '9786175480083',
  })
  @IsISBN()
  isbn!: string;
}
