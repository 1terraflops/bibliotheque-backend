import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { GetBookByISBNRequestDto } from './dto/get-book-by-isbn-request.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetBookResponseDto } from './dto/get-book-response.dto';
import { AddBookByISBNRequestDto } from './dto/add-book-request.dto';

@UseGuards(AuthGuard)
@Controller({
  path: 'books',
  version: '1',
})
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async findInGoogleBooks(@Query() dto: GetBookByISBNRequestDto) {
    const response = await this.booksService.findInGoogleBooks(dto);

    if (!response || !response.items?.length) {
      throw new NotFoundException(`Book with ISBN ${dto.isbn} not found`);
    }

    return new GetBookResponseDto(response.items[0]);
  }

  @Post()
  async addBookToDB(@Query() dto: AddBookByISBNRequestDto) {
    return this.booksService.insertBookToDB(dto);
  }
}
