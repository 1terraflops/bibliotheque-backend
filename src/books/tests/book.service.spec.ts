import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { BooksService } from '../books.service';
import { PrismaService } from 'src/_database/prisma.service';
import { SupabaseStorageService } from 'src/_storage/supabase_storage.service';
import { GoogleBooksService } from '../google-books.service';
import { BookStatus } from 'generated/prisma/client';

const mockBook = {
  id: 1,
  isbn: '9786175480083',
  title: 'Test Book',
  author: 'Test Author',
  pageCount: 300,
  coverUrl: 'https://example.com/cover.jpg',
};

const mockUsersBook = {
  bookId: 1,
  profileId: 'user-1',
  pagesRead: 0,
  status: BookStatus.NOT_STARTED,
  isFavorite: false,
  book: mockBook,
};

const mockPrisma = {
  books: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  usersBooks: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockGoogleBooksService = {
  findInGoogleBooks: jest.fn(),
};

const mockStorage = {
  upload: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('BooksService', () => {
  let service: BooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SupabaseStorageService, useValue: mockStorage },
        { provide: GoogleBooksService, useValue: mockGoogleBooksService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findBook', () => {
    const dto = { isbn: '9786175480083' };

    it('returns from cache when available', async () => {
      mockCacheManager.get.mockResolvedValue(mockBook);

      const result = await service.findBook(dto);

      expect(result).toEqual(mockBook);
      expect(mockPrisma.books.findUnique).not.toHaveBeenCalled();
      expect(mockGoogleBooksService.findInGoogleBooks).not.toHaveBeenCalled();
    });

    it('returns from DB and caches when cache is empty', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.books.findUnique.mockResolvedValue(mockBook);

      const result = await service.findBook(dto);

      expect(result).toEqual(mockBook);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        dto.isbn,
        mockBook,
        expect.any(Number),
      );
      expect(mockGoogleBooksService.findInGoogleBooks).not.toHaveBeenCalled();
    });

    it('falls back to Google Books when not in DB or cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.books.findUnique.mockResolvedValue(null);
      mockGoogleBooksService.findInGoogleBooks.mockResolvedValue(mockBook);

      const result = await service.findBook(dto);

      expect(result).toEqual(mockBook);
      expect(mockGoogleBooksService.findInGoogleBooks).toHaveBeenCalledWith(
        dto,
      );
    });
  });

  describe('findUsersBook', () => {
    const dto = { isbn: '9786175480083' };
    const profileId = 'user-1';

    it('returns the users book when found', async () => {
      mockCacheManager.get.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(mockUsersBook);

      const result = await service.findUsersBook(dto, profileId);

      expect(result).toEqual(mockUsersBook);
      expect(mockPrisma.usersBooks.findUnique).toHaveBeenCalledWith({
        where: { profileId_bookId: { profileId, bookId: mockBook.id } },
        include: { book: true },
      });
    });

    it('throws NotFoundException when ISBN is unknown', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.books.findUnique.mockResolvedValue(null);

      await expect(service.findUsersBook(dto, profileId)).rejects.toThrow(
        new NotFoundException('Unknown ISBN'),
      );
    });
  });

  describe('findAllUsersBooks', () => {
    const profileId = 'user-1';

    it('queries with correct filters and pagination', async () => {
      const dto = {
        status: BookStatus.IN_PROGRESS,
        sort: 'desc' as const,
        take: 5,
        offset: 10,
      };
      mockPrisma.usersBooks.findMany.mockResolvedValue([mockUsersBook]);

      const result = await service.findAllUsersBooks(dto, profileId);

      expect(result).toEqual([mockUsersBook]);
      expect(mockPrisma.usersBooks.findMany).toHaveBeenCalledWith({
        where: { profileId, status: dto.status },
        include: { book: true },
        orderBy: { updatedAt: dto.sort },
        take: dto.take,
        skip: dto.offset,
      });
    });

    it('omits isFavorite filter when undefined', async () => {
      const dto = { sort: 'desc' as const };
      mockPrisma.usersBooks.findMany.mockResolvedValue([] as never);

      await service.findAllUsersBooks(dto, profileId);

      const calls = mockPrisma.usersBooks.findMany.mock.calls as Array<
        [{ where: Record<string, unknown> }]
      >;
      const call = calls[0][0];
      expect(call.where).not.toHaveProperty('isFavorite');
    });
  });

  describe('getDashboard', () => {
    it('returns books grouped by status plus favorites', async () => {
      mockPrisma.usersBooks.findMany.mockResolvedValue([mockUsersBook]);

      const result = await service.getDashboard('user-1');

      const statuses = result.map((r) => r.status);
      expect(statuses).toEqual([
        BookStatus.IN_PROGRESS,
        BookStatus.NOT_STARTED,
        BookStatus.COMPLETED,
        BookStatus.DROPPED,
        'FAVORITES',
      ]);
      expect(mockPrisma.usersBooks.findMany).toHaveBeenCalledTimes(5);
    });
  });

  describe('addBookToProfile', () => {
    const dto = { isbn: '9786175480083' };
    const profileId = 'user-1';

    it('creates and returns a new users book', async () => {
      mockCacheManager.get.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(null);
      mockPrisma.usersBooks.create.mockResolvedValue(mockUsersBook);

      const result = await service.addBookToProfile(dto, profileId);

      expect(result).toEqual(mockUsersBook);
      expect(mockPrisma.usersBooks.create).toHaveBeenCalledWith({
        data: {
          profileId,
          bookId: mockBook.id,
          actualPageCount: mockBook.pageCount,
          cover: mockBook.coverUrl,
        },
        include: { book: true },
      });
    });

    it('fetches from Google Books and saves to DB when not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.books.findUnique.mockResolvedValue(null);
      mockGoogleBooksService.findInGoogleBooks.mockResolvedValue(mockBook);
      mockPrisma.books.create.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(null);
      mockPrisma.usersBooks.create.mockResolvedValue(mockUsersBook);

      await service.addBookToProfile(dto, profileId);

      expect(mockGoogleBooksService.findInGoogleBooks).toHaveBeenCalled();
      expect(mockPrisma.books.create).toHaveBeenCalledWith({ data: mockBook });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Book not found locally, fetching from Google Books',
        expect.objectContaining({ isbn: dto.isbn }),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Book saved to database',
        expect.objectContaining({ isbn: dto.isbn, bookId: mockBook.id }),
      );
    });

    it('logs and throws ConflictException when book already in library', async () => {
      mockCacheManager.get.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(mockUsersBook);

      await expect(service.addBookToProfile(dto, profileId)).rejects.toThrow(
        new ConflictException('This book is already in your library'),
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Attempted to add a book that is already in the library',
        expect.objectContaining({ isbn: dto.isbn, profileId }),
      );
      expect(mockPrisma.usersBooks.create).not.toHaveBeenCalled();
    });

    it('logs success after adding book', async () => {
      mockCacheManager.get.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(null);
      mockPrisma.usersBooks.create.mockResolvedValue(mockUsersBook);

      await service.addBookToProfile(dto, profileId);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Book added to profile',
        expect.objectContaining({
          isbn: dto.isbn,
          bookId: mockBook.id,
          profileId,
        }),
      );
    });
  });

  describe('uploadBookCover', () => {
    it('uploads file, logs, and updates cover URL', async () => {
      const file = { buffer: Buffer.from('') } as Express.Multer.File;
      const url = 'https://storage.example.com/cover.jpg';
      mockStorage.upload.mockResolvedValue(url);
      mockPrisma.usersBooks.updateMany.mockResolvedValue({ count: 1 });

      await service.uploadBookCover(file, 1, 'user-1');

      expect(mockStorage.upload).toHaveBeenCalledWith(
        file,
        'covers',
        'user-1/1',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Book cover uploaded',
        expect.objectContaining({ bookId: 1, profileId: 'user-1', url }),
      );
      expect(mockPrisma.usersBooks.updateMany).toHaveBeenCalledWith({
        where: { bookId: 1, profileId: 'user-1' },
        data: { cover: url },
      });
    });
  });

  describe('updateUsersBook', () => {
    const isbnDto = { isbn: '9786175480083' };
    const profileId = 'user-1';

    it('updates and returns the book', async () => {
      const dto = { status: BookStatus.IN_PROGRESS };
      const updated = { ...mockUsersBook, ...dto };
      mockCacheManager.get.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(mockUsersBook);
      mockPrisma.usersBooks.update.mockResolvedValue(updated);

      const result = await service.updateUsersBook(dto, isbnDto, profileId);

      expect(result).toEqual(updated);
      expect(mockPrisma.usersBooks.update).toHaveBeenCalledWith({
        where: {
          profileId_bookId: { profileId, bookId: mockUsersBook.bookId },
        },
        data: dto,
      });
    });

    it('throws NotFoundException when book not in library', async () => {
      mockCacheManager.get.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUsersBook(
          { status: BookStatus.IN_PROGRESS },
          isbnDto,
          profileId,
        ),
      ).rejects.toThrow(
        new NotFoundException('This user does not have this book'),
      );
    });
  });

  describe('deleteBookFromProfile', () => {
    const dto = { isbn: '9786175480083' };
    const profileId = 'user-1';

    it('deletes the book and logs', async () => {
      mockCacheManager.get.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(mockUsersBook);
      mockPrisma.usersBooks.delete.mockResolvedValue(mockUsersBook);

      await service.deleteBookFromProfile(dto, profileId);

      expect(mockPrisma.usersBooks.delete).toHaveBeenCalledWith({
        where: {
          profileId_bookId: { profileId, bookId: mockUsersBook.bookId },
        },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Book deleted from profile',
        expect.objectContaining({
          isbn: dto.isbn,
          bookId: mockUsersBook.bookId,
          profileId,
        }),
      );
    });

    it('throws NotFoundException and does not delete when book not in library', async () => {
      mockCacheManager.get.mockResolvedValue(mockBook);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteBookFromProfile(dto, profileId),
      ).rejects.toThrow(
        new NotFoundException('This user does not have this book'),
      );

      expect(mockPrisma.usersBooks.delete).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
