import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetBookByISBNRequestDto } from './dto/get-book-by-isbn-request.dto';
import { firstValueFrom } from 'rxjs';
import { GoogleBooksResponseDto } from './dto/google-book-item.interface';
import { PrismaService } from 'src/_database/prisma.service';
import { AddBookByISBNRequestDto } from './dto/add-book-request.dto';
import { NormalizedBookDto } from './dto/normalized-book-dto';
import { DeleteBookRequestDto } from './dto/delete-book-request.dto';
import { UpdateBookRequestDto } from './dto/update-book-request.dto';
import { isbnDto } from '../_types/isbn.dto';
import { GetAllUsersBooksRequestDto } from './dto/get-all-users-books-request.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { Books, BookStatus } from 'generated/prisma/client';
import { AddReviewRequestDto } from './dto/add-review-request.dto';
import { SupabaseStorageService } from 'src/_storage/supabase_storage.service';

const TTL = 1000 * 60;

@Injectable()
export class BooksService {
  private readonly GBOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async findBookInDB(dto: isbnDto) {
    const cached = await this.cacheManager.get<Books>(dto.isbn);
    if (cached) return cached;

    const book = await this.prisma.books.findUnique({
      where: { isbn: dto.isbn },
    });

    if (book) {
      await this.cacheManager.set(dto.isbn, book, TTL);
    }

    return book;
  }

  private async findInGoogleBooks(dto: isbnDto) {
    const response = await firstValueFrom(
      this.httpService.get<GoogleBooksResponseDto>(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${dto.isbn}&key=${this.GBOOKS_API_KEY}`,
      ),
    );

    if (!response || !response.data.items?.length) {
      throw new NotFoundException(`Book with ISBN ${dto.isbn} not found`);
    }

    return new NormalizedBookDto(response.data.items[0]);
  }

  private async saveAndGetBook(dto: isbnDto) {
    const existingBook = await this.findBookInDB(dto);

    if (existingBook) {
      return existingBook;
    }

    const bookData = await this.findInGoogleBooks(dto);

    const book = await this.prisma.books.create({
      data: bookData,
    });

    await this.cacheManager.set(dto.isbn, book, TTL);

    return book;
  }

  async findBook(dto: GetBookByISBNRequestDto) {
    const responseDB = await this.findBookInDB(dto);

    if (responseDB) {
      return responseDB;
    }

    return await this.findInGoogleBooks(dto);
  }

  async findAllUsersBooks(dto: GetAllUsersBooksRequestDto, profileId: string) {
    const { status, sort, take = 10, offset = 0, isFavorite } = dto;

    return this.prisma.usersBooks.findMany({
      where: {
        profileId,
        status: status,
        ...(isFavorite !== undefined && { isFavorite }),
      },
      include: { book: true },
      orderBy: { updatedAt: sort },
      take,
      skip: offset,
    });
  }

  async findUsersBook(dto: isbnDto, profileId: string) {
    const book = await this.findBookInDB(dto);

    if (!book) {
      throw new NotFoundException('Unknown ISBN');
    }

    return this.prisma.usersBooks.findUnique({
      where: {
        profileId_bookId: {
          profileId,
          bookId: book.id,
        },
      },
      include: { book: true },
    });
  }

  async getDashboard(id: string) {
    const statuses = [
      BookStatus.IN_PROGRESS,
      BookStatus.NOT_STARTED,
      BookStatus.COMPLETED,
      BookStatus.DROPPED,
    ];

    const statusQueries = statuses.map((status) =>
      this.prisma.usersBooks.findMany({
        where: { profileId: id, status: status },
        orderBy: { updatedAt: 'desc' },
        include: { book: true },
        take: 7,
      }),
    );

    const favoritesQuery = this.prisma.usersBooks.findMany({
      where: { profileId: id, isFavorite: true },
      orderBy: { updatedAt: 'desc' },
      include: { book: true },
      take: 7,
    });

    const results = await Promise.all([...statusQueries, favoritesQuery]);

    const statusResults = statuses.map((status, i) => ({
      status,
      books: results[i],
    }));

    const favorites = {
      status: 'FAVORITES',
      books: results[results.length - 1],
    };

    return [...statusResults, favorites];
  }

  async addReview(dto: AddReviewRequestDto, profileId: string) {
    const { id, review, hasSpoilers } = dto;

    return await this.prisma.booksReviews.upsert({
      where: { profileId_bookId: { profileId, bookId: id } },
      create: { profileId, bookId: id, review, hasSpoilers },
      update: { review, hasSpoilers },
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
        actualPageCount: book.pageCount ?? 0,
        cover: book.coverUrl,
      },
      include: { book: true },
    });
  }

  async uploadBookCover(
    file: Express.Multer.File,
    bookId: number,
    profileId: string,
  ) {
    const url = await this.storage.upload(
      file,
      'covers',
      `${profileId}/${bookId}`,
    );

    return await this.prisma.usersBooks.updateMany({
      where: { bookId, profileId },
      data: { cover: url },
    });
  }

  async updateUsersBook(
    dto: UpdateBookRequestDto,
    isbnDto: isbnDto,
    profileId: string,
  ) {
    const book = await this.findUsersBook(isbnDto, profileId);

    if (!book) {
      throw new NotFoundException('This user does not have this book');
    }

    return await this.prisma.usersBooks.update({
      where: {
        profileId_bookId: {
          profileId,
          bookId: book.bookId,
        },
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookFromProfile(dto: DeleteBookRequestDto, profileId: string) {
    const book = await this.findUsersBook(dto, profileId);

    if (!book) {
      throw new NotFoundException('This user does not have this book');
    }

    await this.prisma.usersBooks.delete({
      where: {
        profileId_bookId: {
          profileId,
          bookId: book.bookId,
        },
      },
    });
  }
}
