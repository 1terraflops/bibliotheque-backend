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
import { GetBookByISBNResponseDto } from './dto/get-book-by-isbn-response.dto';
import { AddBookByISBNRequestDto } from './dto/add-book-request.dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async findByISBN(dto: GetBookByISBNRequestDto) {
    const response = await firstValueFrom(
      this.httpService.get<GoogleBooksResponseDto>(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${dto.isbn}`,
      ),
    );

    return response.data;
  }

  async insertBookToDB(dto: AddBookByISBNRequestDto) {
    const response = await this.findByISBN(dto);

    if (!response || !response.items) {
      throw new NotFoundException(`Book with ISBN ${dto.isbn} not found`);
    }

    const book = response.items[0];
    const formattedBookData = new GetBookByISBNResponseDto(book);

    try {
      const result = await this.prisma.books.create({
        data: formattedBookData,
      });

      return result;
    } catch {
      throw new NotAcceptableException('Book with this ISBN already exists');
    }
  }
}
