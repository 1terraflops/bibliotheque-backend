import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { GetBookByISBNRequestDto } from './dto/get-book-by-isbn-request.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { AddBookByISBNRequestDto } from './dto/add-book-request.dto';
import { BookResponseDto } from './dto/book-response.dto';

@UseGuards(AuthGuard)
@Controller({
  path: 'books',
  version: '1',
})
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async findBook(@Query() dto: GetBookByISBNRequestDto) {
    const response = await this.booksService.findBook(dto);
    return new BookResponseDto(response);
  }

  @Post()
  async addBookToDB(@Body() dto: AddBookByISBNRequestDto) {
    const response = await this.booksService.insertBookToDB(dto);
    return new BookResponseDto(response);
  }
}
