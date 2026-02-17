import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { DeleteBookRequestDto } from './dto/delete-book-request.dto';
import { UpdateBookRequestDto } from './dto/update-book-request.dto';
import { isbnDto } from './dto/isbn.dto';
import { GetAllUsersBooksRequestDto } from './dto/get-all-users-books-request.dto';

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
  async getAllBooks(
    @Query() dto: GetAllUsersBooksRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.findAllUsersBooks(dto, id);
  }

  @Get('users-book/:isbn')
  @SerializeOptions({ type: UserBookResponseDto })
  async getUsersBook(@Param() dto: isbnDto, @CurrentUser('id') id: string) {
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

  @Patch(':isbn')
  @SerializeOptions({ type: UserBookResponseDto })
  async updateUsersBook(
    @Body() dto: UpdateBookRequestDto,
    @Param() isbnDto: isbnDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.updateUsersBook(dto, isbnDto, id);
  }

  @Delete(':isbn')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBookFromProfile(
    @Param() dto: DeleteBookRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.deleteBookFromProfile(dto, id);
  }
}
