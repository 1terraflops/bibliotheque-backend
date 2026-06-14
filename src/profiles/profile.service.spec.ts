import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ProfilesService } from './profiles.service';
import { PrismaService } from 'src/_database/prisma.service';

const mockReview = {
  id: 1,
  bookId: 1,
  profileId: 'user-1',
  review: 'Great book!',
  hasSpoilers: false,
  createdAt: new Date('2024-01-01'),
  book: {
    id: 1,
    title: 'Test Book',
    isbn: '9786175480083',
  },
};

const mockPrisma = {
  booksReviews: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('ProfilesService', () => {
  let service: ProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getMyReviews', () => {
    const profileId = 'user-1';

    it('returns items and null cursor when results fit within take', async () => {
      mockPrisma.booksReviews.findMany.mockResolvedValue([mockReview]);

      const result = await service.getMyReviews({ take: 10 }, profileId);

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('returns nextCursor and pops last item when next page exists', async () => {
      const reviews = Array.from({ length: 11 }, (_, i) => ({
        ...mockReview,
        id: i + 1,
      }));
      mockPrisma.booksReviews.findMany.mockResolvedValue(reviews);

      const result = await service.getMyReviews({ take: 10 }, profileId);

      expect(result.items).toHaveLength(10);
      expect(result.nextCursor).toBe(10);
    });

    it('queries with correct profileId filter', async () => {
      mockPrisma.booksReviews.findMany.mockResolvedValue([]);

      await service.getMyReviews({ take: 10 }, profileId);

      expect(mockPrisma.booksReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { profileId },
        }),
      );
    });

    it('includes cursor and skip when cursor is provided', async () => {
      mockPrisma.booksReviews.findMany.mockResolvedValue([]);

      await service.getMyReviews({ take: 10, cursor: 5 }, profileId);

      expect(mockPrisma.booksReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 5 },
          skip: 1,
        }),
      );
    });

    it('omits cursor and skip when no cursor provided', async () => {
      mockPrisma.booksReviews.findMany.mockResolvedValue([]);

      await service.getMyReviews({ take: 10 }, profileId);

      const calls = mockPrisma.booksReviews.findMany.mock.calls as Array<
        [Record<string, unknown>]
      >;
      const call = calls[0][0];
      expect(call).not.toHaveProperty('cursor');
      expect(call).not.toHaveProperty('skip');
    });
  });

  describe('getUserReviews', () => {
    it('returns items and null cursor when results fit within take', async () => {
      mockPrisma.booksReviews.findMany.mockResolvedValue([mockReview]);

      const result = await service.getUserReviews({ take: 10 }, 'johndoe');

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('queries with correct username filter', async () => {
      mockPrisma.booksReviews.findMany.mockResolvedValue([]);

      await service.getUserReviews({ take: 10 }, 'johndoe');

      expect(mockPrisma.booksReviews.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { profile: { username: 'johndoe' } },
        }),
      );
    });
  });

  describe('deleteReview', () => {
    const profileId = 'user-1';

    it('deletes the review and returns it', async () => {
      mockPrisma.booksReviews.findFirst.mockResolvedValue(mockReview);
      mockPrisma.booksReviews.delete.mockResolvedValue(mockReview);

      const result = await service.deleteReview(1, profileId);

      expect(result).toEqual(mockReview);
      expect(mockPrisma.booksReviews.delete).toHaveBeenCalledWith({
        where: { id: 1, profileId },
      });
    });

    it('logs after successful deletion', async () => {
      mockPrisma.booksReviews.findFirst.mockResolvedValue(mockReview);
      mockPrisma.booksReviews.delete.mockResolvedValue(mockReview);

      await service.deleteReview(1, profileId);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Review deleted',
        expect.objectContaining({ reviewId: 1, profileId }),
      );
    });

    it('throws NotFoundException when review does not exist', async () => {
      mockPrisma.booksReviews.findFirst.mockResolvedValue(null);

      await expect(service.deleteReview(1, profileId)).rejects.toThrow(
        new NotFoundException('Review not found'),
      );
    });

    it('does not delete or log when review is not found', async () => {
      mockPrisma.booksReviews.findFirst.mockResolvedValue(null);

      await expect(service.deleteReview(1, profileId)).rejects.toThrow();

      expect(mockPrisma.booksReviews.delete).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
