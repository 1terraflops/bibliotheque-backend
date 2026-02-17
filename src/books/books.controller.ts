import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { GetBookByISBNRequestDto } from './dto/get-book-by-isbn-request.dto';
import { AddBookByISBNRequestDto } from './dto/add-book-request.dto';
import { BookResponseDto } from './dto/book-response.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserBookResponseDto } from './dto/user-book-response.dto';

@Controller({
  path: 'books',
  version: '1',
})
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @SerializeOptions({ type: BookResponseDto })
  async findBook(@Query() dto: GetBookByISBNRequestDto) {
    return await this.booksService.findBook(dto);
  }

  @Get('all-users-books')
  @SerializeOptions({ type: UserBookResponseDto })
  async getAllBooks(@CurrentUser('id') id: string) {
    return await this.booksService.findAllUsersBooks(id);
  }

  @Get('users-book')
  @SerializeOptions({ type: UserBookResponseDto })
  async getUsersBook(
    @Query() dto: GetBookByISBNRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.findUsersBook(dto, id);
  }

  @Post()
  @SerializeOptions({ type: UserBookResponseDto })
  async addBook(
    @Body() dto: AddBookByISBNRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.booksService.addBookToProfile(dto, userId);
  }
}
