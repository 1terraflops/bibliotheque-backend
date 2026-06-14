import { Test, TestingModule } from '@nestjs/testing';
import { BookReviewsService } from '../book-reviews.service';
import { PrismaService } from 'src/_database/prisma.service';

const mockReview = {
  id: 1,
  bookId: 1,
  profileId: 'user-1',
  review: 'Great book!',
  hasSpoilers: false,
  createdAt: new Date('2024-01-01'),
  profile: {
    full_name: 'John Doe' as string | null,
    username: 'johndoe',
  },
};

const mockPrisma = {
  booksReviews: {
    upsert: jest.fn() as jest.MockedFunction<() => Promise<typeof mockReview>>,
    findMany: jest.fn() as jest.MockedFunction<
      () => Promise<(typeof mockReview)[]>
    >,
  },
};

describe('BookReviewsService', () => {
  let service: BookReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BookReviewsService>(BookReviewsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('addReview', () => {
    const profileId = 'user-1';

    it('creates a review when none exists', async () => {
      const dto = { id: 1, review: 'Great book!', hasSpoilers: false };
      mockPrisma.booksReviews.upsert.mockResolvedValue(mockReview);

      const result = await service.addReview(dto, profileId);

      expect(result).toEqual(mockReview);
      expect(mockPrisma.booksReviews.upsert).toHaveBeenCalledWith({
        where: { profileId_bookId: { profileId, bookId: dto.id } },
        create: {
          profileId,
          bookId: dto.id,
          review: dto.review,
          hasSpoilers: dto.hasSpoilers,
        },
        update: { review: dto.review, hasSpoilers: dto.hasSpoilers },
      });
    });

    it('updates an existing review', async () => {
      const dto = { id: 1, review: 'Updated review', hasSpoilers: true };
      const updated = {
        ...mockReview,
        review: dto.review,
        hasSpoilers: dto.hasSpoilers,
      };
      mockPrisma.booksReviews.upsert.mockResolvedValue(updated);

      const result = await service.addReview(dto, profileId);

      expect(result).toEqual(updated);
      expect(mockPrisma.booksReviews.upsert).toHaveBeenCalledWith({
        where: { profileId_bookId: { profileId, bookId: dto.id } },
        create: {
          profileId,
          bookId: dto.id,
          review: dto.review,
          hasSpoilers: dto.hasSpoilers,
        },
        update: { review: dto.review, hasSpoilers: dto.hasSpoilers },
      });
    });
  });

  describe('getReviewsForBook', () => {
    it('returns mapped reviews for a book', async () => {
      mockPrisma.booksReviews.findMany.mockResolvedValue([mockReview]);

      const result = await service.getReviewsForBook('9786175480083');

      expect(result).toEqual([
        {
          review: mockReview.review,
          hasSpoilers: mockReview.hasSpoilers,
          createdAt: mockReview.createdAt,
          author: mockReview.profile.full_name,
        },
      ]);
      expect(mockPrisma.booksReviews.findMany).toHaveBeenCalledWith({
        where: { book: { isbn: '9786175480083' } },
        include: { profile: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('falls back to username when full_name is null', async () => {
      const reviewWithoutName = {
        ...mockReview,
        profile: { full_name: null, username: 'johndoe' },
      };
      mockPrisma.booksReviews.findMany.mockResolvedValue([reviewWithoutName]);

      const result = await service.getReviewsForBook('9786175480083');

      expect(result[0].author).toBe('johndoe');
    });

    it('returns empty array when no reviews exist', async () => {
      mockPrisma.booksReviews.findMany.mockResolvedValue([]);

      const result = await service.getReviewsForBook('9786175480083');

      expect(result).toEqual([]);
    });
  });
});
