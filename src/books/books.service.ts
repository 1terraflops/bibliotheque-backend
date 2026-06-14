import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetBookByISBNRequestDto } from './dto/books/get-book-by-isbn-request.dto';
import { PrismaService } from 'src/_database/prisma.service';
import { AddBookByISBNRequestDto } from './dto/books/add-book-request.dto';
import { DeleteBookRequestDto } from './dto/books/delete-book-request.dto';
import { UpdateBookRequestDto } from './dto/books/update-book-request.dto';
import { isbnDto } from '../_types/isbn.dto';
import { GetAllUsersBooksRequestDto } from './dto/books/get-all-users-books-request.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';
import { Books, BookStatus } from 'generated/prisma/client';
import { SupabaseStorageService } from 'src/_storage/supabase_storage.service';
import { GoogleBooksService } from './google-books.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class BooksService {
  private readonly TTL = 1000 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
    private readonly googleBooksService: GoogleBooksService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private async findBookInDB(dto: isbnDto) {
    const cached = await this.cacheManager.get<Books>(dto.isbn);
    if (cached) return cached;

    const book = await this.prisma.books.findUnique({
      where: { isbn: dto.isbn },
    });

    if (book) {
      await this.cacheManager.set(dto.isbn, book, this.TTL);
    }

    return book;
  }

  async findBook(dto: GetBookByISBNRequestDto) {
    const responseDB = await this.findBookInDB(dto);

    if (responseDB) {
      return responseDB;
    }

    return await this.googleBooksService.findInGoogleBooks(dto);
  }

  private async findOrCreateBook(dto: isbnDto) {
    const existingBook = await this.findBookInDB(dto);

    if (existingBook) {
      return existingBook;
    }

    this.logger.info('Book not found locally, fetching from Google Books', {
      context: BooksService.name,
      isbn: dto.isbn,
    });

    const bookData = await this.googleBooksService.findInGoogleBooks(dto);

    const book = await this.prisma.books.create({
      data: bookData,
    });

    this.logger.info('Book saved to database', {
      context: BooksService.name,
      isbn: dto.isbn,
      bookId: book.id,
    });

    await this.cacheManager.set(dto.isbn, book, this.TTL);

    return book;
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

  async addBookToProfile(dto: AddBookByISBNRequestDto, profileId: string) {
    const book = await this.findOrCreateBook(dto);

    const existingBook = await this.prisma.usersBooks.findUnique({
      where: {
        profileId_bookId: {
          profileId,
          bookId: book.id,
        },
      },
    });

    if (existingBook) {
      this.logger.warn(
        'Attempted to add a book that is already in the library',
        {
          context: BooksService.name,
          isbn: dto.isbn,
          profileId,
        },
      );
      throw new ConflictException('This book is already in your library');
    }

    const userBook = await this.prisma.usersBooks.create({
      data: {
        profileId,
        bookId: book.id,
        actualPageCount: book.pageCount ?? 0,
        cover: book.coverUrl,
      },
      include: { book: true },
    });

    this.logger.info('Book added to profile', {
      context: BooksService.name,
      isbn: dto.isbn,
      bookId: book.id,
      profileId,
    });

    return userBook;
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

    this.logger.info('Book cover uploaded', {
      context: BooksService.name,
      bookId,
      profileId,
      url,
    });

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

    this.logger.info('Book deleted from profile', {
      context: BooksService.name,
      isbn: dto.isbn,
      bookId: book.bookId,
      profileId,
    });
  }
}
