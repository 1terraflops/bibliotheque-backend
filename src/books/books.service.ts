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
import {
  Books,
  BookStatus,
  Sessions,
  SessionStatus,
} from 'generated/prisma/client';
import { AddReviewRequestDto } from './dto/add-review-request.dto';
import { SupabaseStorageService } from 'src/_storage/supabase_storage.service';
import moment from 'moment';
import { GetReadingHistoryRequestDto } from './dto/get-reading-history-request.dto';
import { GetBookByNameRequestDto } from './dto/get-book-by-name-request.dto';

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

  async findByNameInGoogleBooks({ query }: GetBookByNameRequestDto) {
    const response = await firstValueFrom(
      this.httpService.get<GoogleBooksResponseDto>(
        `https://www.googleapis.com/books/v1/volumes`,
        {
          params: {
            q: query,
            key: this.GBOOKS_API_KEY,
            maxResults: 10,
            langRestrict: 'en',
            country: 'US',
          },
        },
      ),
    );

    if (!response.data.items?.length) {
      throw new NotFoundException('No such book found');
    }

    return response.data.items.map((book) => new NormalizedBookDto(book));
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

  async getFinishedBooksCount(profileId: string) {
    return this.prisma.usersBooks.count({
      where: { profileId, status: BookStatus.COMPLETED },
    });
  }

  async getUserReadingStats(profileId: string) {
    const userBooks = await this.prisma.usersBooks.findMany({
      where: { profileId },
    });

    const sessions = await this.prisma.sessions.findMany({
      where: {
        profileId,
        status: { not: SessionStatus.CANCELLED },
      },
    });

    const booksRead = await this.getFinishedBooksCount(profileId);

    const pagesRead = userBooks.reduce(
      (sum, book) => sum + (book.pagesRead ?? 0),
      0,
    );

    const totalSessions = sessions.length;

    const totalSessionDuration = sessions.reduce(
      (sum, session) => sum + (session.duration ?? 0),
      0,
    );

    const avgSessionDuration =
      totalSessions > 0 ? totalSessionDuration / totalSessions : 0;

    const avgReadingSpeed =
      totalSessionDuration > 0 ? pagesRead / (totalSessionDuration / 60) : 0;

    const avgPagesPerSession =
      totalSessions > 0 ? pagesRead / totalSessions : 0;

    const durations = sessions.map((s) => s.duration ?? 0);

    const longestSession = durations.length > 0 ? Math.max(...durations) : 0;

    const timeDistribution =
      sessions.length > 0
        ? this.calculateTimeDistribution(sessions)
        : {
            night: 0,
            morning: 0,
            afternoon: 0,
            evening: 0,
          };

    const mostCommonTimeOfTheDay =
      this.getMostCommonTimeOfDay(timeDistribution);

    return {
      booksRead,
      pagesRead,
      totalSessions,
      totalSessionDuration,
      avgSessionDuration: Math.round(avgSessionDuration),
      longestSession,
      avgReadingSpeed: Math.round(avgReadingSpeed),
      avgPagesPerSession: Math.round(avgPagesPerSession),
      mostCommonTimeOfTheDay,
    };
  }

  private getMostCommonTimeOfDay(buckets: {
    night: number;
    morning: number;
    afternoon: number;
    evening: number;
  }) {
    return Object.entries(buckets).reduce((max, current) => {
      return current[1] > max[1] ? current : max;
    })[0];
  }

  private calculateTimeDistribution(rawSessions: Sessions[]) {
    const buckets = {
      night: 0,
      morning: 0,
      afternoon: 0,
      evening: 0,
    };

    rawSessions.forEach((session) => {
      const start = moment(session.startedAt);
      const end = moment(session.finishedAt);

      const durationMinutes = end.diff(start, 'minutes');
      const mid = moment(start).add(durationMinutes / 2, 'minutes');
      const hour = mid.hour();

      if (hour < 6) {
        buckets.night += durationMinutes;
      } else if (hour < 12) {
        buckets.morning += durationMinutes;
      } else if (hour < 18) {
        buckets.afternoon += durationMinutes;
      } else {
        buckets.evening += durationMinutes;
      }
    });

    return buckets;
  }

  async getUserReadingHeatmapData(
    profileId: string,
  ): Promise<{ heatmapData: { date: string; count: number }[] }> {
    const since = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);

    const sessions = await this.prisma.sessions.findMany({
      where: {
        profileId,
        status: SessionStatus.ENDED,
        startedAt: { gte: since },
      },
      select: { startedAt: true, duration: true },
    });

    const minutesByDate = sessions.reduce<Record<string, number>>(
      (acc, session) => {
        const date = session.startedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] ?? 0) + (session?.duration ?? 0);
        return acc;
      },
      {},
    );

    const heatmapData = Object.entries(minutesByDate).map(
      ([date, totalMinutes]) => ({
        date,
        count: Math.min(Math.round((totalMinutes / 60) * 10) / 10, 4),
      }),
    );

    return { heatmapData };
  }

  async getReadingHistory(profileId: string, dto: GetReadingHistoryRequestDto) {
    const { cursor, take = 20 } = dto;
    const safeTake = Math.min(take, 100);

    const sessions = await this.prisma.sessions.findMany({
      where: {
        profileId,
        status: SessionStatus.ENDED,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: safeTake,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      include: {
        usersBook: {
          include: {
            book: true,
          },
        },
      },
    });

    const groupedHistory = Object.values(
      sessions.reduce<
        Record<
          string,
          {
            date: string;
            sessions: any[];
          }
        >
      >((acc, session) => {
        const date = session.startedAt.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!acc[date]) {
          acc[date] = {
            date,
            sessions: [],
          };
        }

        acc[date].sessions.push({
          id: session.id,
          startedAt: session.startedAt,
          finishedAt: session.finishedAt,
          duration: session.duration,
          readingSpeed: session.readingSpeed,
          pagesRead: session.pagesRead,
          title: session.usersBook.book.title,
          author: session.usersBook.book.author,
          cover: session.usersBook.cover,
        });

        return acc;
      }, {}),
    );

    const nextCursor =
      sessions.length === safeTake ? sessions[sessions.length - 1].id : null;

    return {
      history: groupedHistory,
      cursor: nextCursor,
    };
  }

  async getReviewsForBook(isbn: string) {
    return this.prisma.booksReviews.findMany({
      where: { book: { isbn } },
      include: { profile: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }
}
