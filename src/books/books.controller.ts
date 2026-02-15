import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { GetBookByISBNRequestDto } from './dto/get-book-by-isbn-request.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AddBookByISBNRequestDto } from './dto/add-book-request.dto';

@UseGuards(AuthGuard)
@Controller({
  path: 'books',
  version: '1',
})
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async findBook(@Query() dto: GetBookByISBNRequestDto) {
    return this.booksService.findBook(dto);
  }

  @Post()
  async addBookToDB(@Body() dto: AddBookByISBNRequestDto) {
    return this.booksService.insertBookToDB(dto);
  }
}
