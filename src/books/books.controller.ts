import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { GetBookByISBNRequestDto } from './dto/get-book-by-isbn-request.dto';
import { GetBookByISBNResponseDto } from './dto/get-book-by-isbn-response.dto';
import { PrismaService } from 'src/database/prisma.service';

@Controller({
  path: 'books',
  version: '1',
})
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getBookByISBN(@Query() dto: GetBookByISBNRequestDto) {
    const book = await this.booksService.findByISBN(dto);

    if (!book || !book.items?.length) {
      throw new NotFoundException(`Books with ISBN ${dto.isbn} was not found`);
    }

    return new GetBookByISBNResponseDto(book.items[0]);
  }

  @Get('users')
  async getUsers() {
    return await this.prisma.profile.findMany();
  }
}
