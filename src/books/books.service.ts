import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { GetBookByISBNRequestDto } from './dto/get-book-by-isbn-request.dto';
import { firstValueFrom } from 'rxjs';
import { GoogleBooksResponseDto } from './dto/google-book-item.interface';
import { PrismaService } from 'src/database/prisma.service';
import { GetBookResponseDto } from './dto/get-book-response.dto';
import { AddBookByISBNRequestDto } from './dto/add-book-request.dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async findInGoogleBooks(dto: GetBookByISBNRequestDto) {
    const response = await firstValueFrom(
      this.httpService.get<GoogleBooksResponseDto>(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${dto.isbn}`,
      ),
    );

    return response.data;
  }

  async findBookInDB(dto: GetBookByISBNRequestDto) {
    const response = await this.prisma.books.findFirst({
      where: { isbn: dto.isbn },
    });

    return response;
  }

  async insertBookToDB(dto: AddBookByISBNRequestDto) {
    const responseGoogleBooks = await this.findInGoogleBooks(dto);
    const responseDB = await this.findBookInDB(dto);

    if (!responseGoogleBooks || !responseGoogleBooks.items) {
      throw new NotFoundException(`Book with ISBN ${dto.isbn} not found`);
    }

    const book = responseGoogleBooks.items[0];
    const formattedBookData = new GetBookResponseDto(book);

    if (formattedBookData.isbn === responseDB?.isbn) {
      throw new NotAcceptableException('Book with this ISBN already exists');
    }

    return await this.prisma.books.create({
      data: formattedBookData,
    });
  }
}
