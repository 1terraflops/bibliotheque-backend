import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Throttle } from '@nestjs/throttler';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StandardResponses } from 'src/decorators/standard-responses.decorator';

@ApiTags('books')
@StandardResponses()
@Controller({
  path: 'books',
  version: '1',
})
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @SerializeOptions({ type: BookResponseDto })
  @ApiOkResponse({
    description: 'Book returned successfully',
    type: BookResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cannot find this book',
  })
  @Throttle({ default: { ttl: 2000, limit: 1 } })
  async findBook(@Query() dto: GetBookByISBNRequestDto) {
    return await this.booksService.findBook(dto);
  }

  @Get('all-users-books')
  @SerializeOptions({ type: UserBookResponseDto })
  @ApiOkResponse({
    description: 'Books returned successfully',
    type: [UserBookResponseDto],
  })
  async getAllBooks(
    @Query() dto: GetAllUsersBooksRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.findAllUsersBooks(dto, id);
  }

  @Get('users-book/:isbn')
  @SerializeOptions({ type: UserBookResponseDto })
  @ApiOkResponse({
    description: 'Book returned successfully',
    type: UserBookResponseDto,
  })
  async getUsersBook(@Param() dto: isbnDto, @CurrentUser('id') id: string) {
    return await this.booksService.findUsersBook(dto, id);
  }

  @Post()
  @SerializeOptions({ type: UserBookResponseDto })
  @ApiCreatedResponse({
    description: 'Book added successfully',
    type: UserBookResponseDto,
  })
  @ApiConflictResponse({
    description: 'This user already has this book',
  })
  async addBook(
    @Body() dto: AddBookByISBNRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.booksService.addBookToProfile(dto, userId);
  }

  @Patch(':isbn')
  @SerializeOptions({ type: UserBookResponseDto })
  @ApiOkResponse({
    description: 'Book updated successfully',
    type: UserBookResponseDto,
  })
  async updateUsersBook(
    @Body() dto: UpdateBookRequestDto,
    @Param() isbnDto: isbnDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.updateUsersBook(dto, isbnDto, id);
  }

  @Delete(':isbn')
  @ApiNoContentResponse({
    description: 'Book deleted successfully',
  })
  async deleteBookFromProfile(
    @Param() dto: DeleteBookRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.deleteBookFromProfile(dto, id);
  }
}
