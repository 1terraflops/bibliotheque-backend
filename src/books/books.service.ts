import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetBookByISBNRequestDto } from './dto/get-book-by-isbn-request.dto';
import { firstValueFrom } from 'rxjs';
import { GoogleBooksResponseDto } from './dto/google-book-item.interface';
import { PrismaService } from 'src/database/prisma.service';
import { AddBookByISBNRequestDto } from './dto/add-book-request.dto';
import { NormalizedBookDto } from './dto/normalized-book-dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  private async findBookInDB(dto: GetBookByISBNRequestDto) {
    return await this.prisma.books.findUnique({
      where: { isbn: dto.isbn },
    });
  }

  private async findInGoogleBooks(dto: GetBookByISBNRequestDto) {
    const response = await firstValueFrom(
      this.httpService.get<GoogleBooksResponseDto>(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${dto.isbn}`,
      ),
    );

    if (!response || !response.data.items?.length) {
      throw new NotFoundException(`Book with ISBN ${dto.isbn} not found`);
    }

    return new NormalizedBookDto(response.data.items[0]);
  }

  async findBook(dto: GetBookByISBNRequestDto) {
    const responseDB = await this.findBookInDB(dto);

    if (responseDB) {
      return responseDB;
    }

    return await this.findInGoogleBooks(dto);
  }

  async saveAndGetBook(dto: AddBookByISBNRequestDto) {
    const existingBook = await this.findBookInDB(dto);

    if (existingBook) {
      return existingBook;
    }

    const bookData = await this.findInGoogleBooks(dto);

    return await this.prisma.books.create({
      data: bookData,
    });
  }

  async addBookToProfile(dto: AddBookByISBNRequestDto, profileId: string) {
    const book = await this.saveAndGetBook(dto);

    const existingBook = await this.prisma.usersBooks.findUnique({
      where: {
        profileId_bookId: {
          profileId,
          bookId: book.id,
        },
      },
    });

    if (existingBook) {
      throw new ConflictException('This book is already in your library');
    }

    return await this.prisma.usersBooks.create({
      data: {
        profileId,
        bookId: book.id,
      },
      include: { book: true },
    });
  }
}
