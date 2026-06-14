import { Test, TestingModule } from '@nestjs/testing';
import { BookStatus, SessionStatus } from 'generated/prisma/client';
import { ReadingStatsService } from '../reading-stats.service';
import { PrismaService } from 'src/_database/prisma.service';

const makeSession = (overrides: {
  startedAt: string;
  finishedAt: string;
  duration?: number;
  pagesRead?: number;
  readingSpeed?: number;
  id?: number;
}) => ({
  id: overrides.id ?? 1,
  profileId: 'user-1',
  bookId: 1,
  status: SessionStatus.ENDED,
  startPage: 0,
  endPage: 10,
  startedAt: new Date(overrides.startedAt),
  finishedAt: new Date(overrides.finishedAt),
  duration: overrides.duration ?? 60,
  pagesRead: overrides.pagesRead ?? 10,
  readingSpeed: overrides.readingSpeed ?? 10,
  usersBook: {
    cover: 'https://example.com/cover.jpg',
    book: {
      title: 'Test Book',
      author: 'Test Author',
    },
  },
});

const makeUserBook = (overrides: {
  status?: BookStatus;
  pagesRead?: number;
}) => ({
  profileId: 'user-1',
  bookId: 1,
  status: overrides.status ?? BookStatus.IN_PROGRESS,
  pagesRead: overrides.pagesRead ?? 0,
});

const mockPrisma = {
  usersBooks: {
    findMany: jest.fn(),
  },
  sessions: {
    findMany: jest.fn(),
  },
};

describe('ReadingStatsService', () => {
  let service: ReadingStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingStatsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReadingStatsService>(ReadingStatsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getUserReadingStats', () => {
    it('returns all zeros when user has no books or sessions', async () => {
      mockPrisma.usersBooks.findMany.mockResolvedValue([]);
      mockPrisma.sessions.findMany.mockResolvedValue([]);

      const result = await service.getUserReadingStats('user-1');

      expect(result).toEqual({
        booksRead: 0,
        pagesRead: 0,
        totalSessions: 0,
        totalSessionDuration: 0,
        avgSessionDuration: 0,
        longestSession: 0,
        avgReadingSpeed: 0,
        avgPagesPerSession: 0,
        mostCommonTimeOfTheDay: expect.any(String),
      } as Record<string, unknown>);
    });

    it('counts only completed books', async () => {
      mockPrisma.usersBooks.findMany.mockResolvedValue([
        makeUserBook({ status: BookStatus.COMPLETED }),
        makeUserBook({ status: BookStatus.COMPLETED }),
        makeUserBook({ status: BookStatus.IN_PROGRESS }),
        makeUserBook({ status: BookStatus.DROPPED }),
      ]);
      mockPrisma.sessions.findMany.mockResolvedValue([]);

      const result = await service.getUserReadingStats('user-1');

      expect(result.booksRead).toBe(2);
    });

    it('sums pages read across all books', async () => {
      mockPrisma.usersBooks.findMany.mockResolvedValue([
        makeUserBook({ pagesRead: 100 }),
        makeUserBook({ pagesRead: 250 }),
        makeUserBook({ pagesRead: 50 }),
      ]);
      mockPrisma.sessions.findMany.mockResolvedValue([]);

      const result = await service.getUserReadingStats('user-1');

      expect(result.pagesRead).toBe(400);
    });

    it('calculates session averages correctly', async () => {
      mockPrisma.usersBooks.findMany.mockResolvedValue([
        makeUserBook({ pagesRead: 120 }),
      ]);
      mockPrisma.sessions.findMany.mockResolvedValue([
        makeSession({
          startedAt: '2024-01-01T09:00:00',
          finishedAt: '2024-01-01T10:00:00',
          duration: 60,
        }),
        makeSession({
          startedAt: '2024-01-02T09:00:00',
          finishedAt: '2024-01-02T10:00:00',
          duration: 120,
        }),
      ]);

      const result = await service.getUserReadingStats('user-1');

      expect(result.totalSessions).toBe(2);
      expect(result.totalSessionDuration).toBe(180);
      expect(result.avgSessionDuration).toBe(90);
      expect(result.longestSession).toBe(120);
    });

    it('identifies the correct most common time of day', async () => {
      mockPrisma.usersBooks.findMany.mockResolvedValue([]);
      mockPrisma.sessions.findMany.mockResolvedValue([
        makeSession({
          startedAt: '2024-01-01T09:00:00',
          finishedAt: '2024-01-01T10:00:00',
          duration: 60,
        }),
        makeSession({
          startedAt: '2024-01-02T09:00:00',
          finishedAt: '2024-01-02T10:00:00',
          duration: 60,
        }),
        makeSession({
          startedAt: '2024-01-01T20:00:00',
          finishedAt: '2024-01-01T21:00:00',
          duration: 60,
        }),
      ]);

      const result = await service.getUserReadingStats('user-1');

      expect(result.mostCommonTimeOfTheDay).toBe('morning');
    });

    it('assigns night bucket for sessions with midpoint before 6am', async () => {
      mockPrisma.usersBooks.findMany.mockResolvedValue([]);
      mockPrisma.sessions.findMany.mockResolvedValue([
        makeSession({
          startedAt: '2024-01-01T02:00:00',
          finishedAt: '2024-01-01T04:00:00',
          duration: 120,
        }),
      ]);

      const result = await service.getUserReadingStats('user-1');

      expect(result.mostCommonTimeOfTheDay).toBe('night');
    });

    it('assigns afternoon bucket for sessions with midpoint between 12 and 18', async () => {
      mockPrisma.usersBooks.findMany.mockResolvedValue([]);
      mockPrisma.sessions.findMany.mockResolvedValue([
        makeSession({
          startedAt: '2024-01-01T14:00:00',
          finishedAt: '2024-01-01T15:00:00',
          duration: 60,
        }),
      ]);

      const result = await service.getUserReadingStats('user-1');

      expect(result.mostCommonTimeOfTheDay).toBe('afternoon');
    });
  });

  describe('getUserReadingHeatmapData', () => {
    it('returns empty heatmap when no sessions exist', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([]);

      const result = await service.getUserReadingHeatmapData('user-1');

      expect(result.heatmapData).toEqual([]);
    });

    it('groups sessions by date and sums durations', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([
        { startedAt: new Date('2024-01-01T09:00:00'), duration: 60 },
        { startedAt: new Date('2024-01-01T14:00:00'), duration: 60 },
        { startedAt: new Date('2024-01-02T09:00:00'), duration: 30 },
      ]);

      const result = await service.getUserReadingHeatmapData('user-1');

      expect(result.heatmapData).toHaveLength(2);
      const jan1 = result.heatmapData.find((d) => d.date === '2024-01-01');
      const jan2 = result.heatmapData.find((d) => d.date === '2024-01-02');
      expect(jan1?.count).toBe(2); // 120 min = 2 hours, capped logic
      expect(jan2?.count).toBe(0.5); // 30 min = 0.5 hours
    });

    it('caps count at 4 for very long reading days', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([
        { startedAt: new Date('2024-01-01T09:00:00'), duration: 600 }, // 10 hours
      ]);

      const result = await service.getUserReadingHeatmapData('user-1');

      expect(result.heatmapData[0].count).toBe(4);
    });
  });

  describe('getReadingHistory', () => {
    it('returns empty history when no sessions exist', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([]);

      const result = await service.getReadingHistory('user-1', { take: 20 });

      expect(result.history).toEqual([]);
      expect(result.cursor).toBeNull();
    });

    it('groups sessions by date', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([
        makeSession({
          id: 1,
          startedAt: '2024-01-01T09:00:00',
          finishedAt: '2024-01-01T10:00:00',
        }),
        makeSession({
          id: 2,
          startedAt: '2024-01-01T14:00:00',
          finishedAt: '2024-01-01T15:00:00',
        }),
        makeSession({
          id: 3,
          startedAt: '2024-01-02T09:00:00',
          finishedAt: '2024-01-02T10:00:00',
        }),
      ]);

      const result = await service.getReadingHistory('user-1', { take: 20 });

      expect(result.history).toHaveLength(2);
      const jan1 = result.history.find((h) => h.date === '2024-01-01');
      const jan2 = result.history.find((h) => h.date === '2024-01-02');
      expect(jan1?.sessions).toHaveLength(2);
      expect(jan2?.sessions).toHaveLength(1);
    });

    it('returns nextCursor when more sessions exist', async () => {
      const sessions = Array.from({ length: 20 }, (_, i) =>
        makeSession({
          id: i + 1,
          startedAt: '2024-01-01T09:00:00',
          finishedAt: '2024-01-01T10:00:00',
        }),
      );
      mockPrisma.sessions.findMany.mockResolvedValue(sessions);

      const result = await service.getReadingHistory('user-1', { take: 20 });

      expect(result.cursor).toBe(20);
    });

    it('returns null cursor when sessions are fewer than take', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([
        makeSession({
          id: 1,
          startedAt: '2024-01-01T09:00:00',
          finishedAt: '2024-01-01T10:00:00',
        }),
      ]);

      const result = await service.getReadingHistory('user-1', { take: 20 });

      expect(result.cursor).toBeNull();
    });

    it('caps take at 100 regardless of input', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([]);

      await service.getReadingHistory('user-1', { take: 999 });

      expect(mockPrisma.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('includes cursor and skip when cursor is provided', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([]);

      await service.getReadingHistory('user-1', { take: 20, cursor: 5 });

      expect(mockPrisma.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 5 }, skip: 1 }),
      );
    });

    it('maps session fields correctly', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([
        makeSession({
          id: 1,
          startedAt: '2024-01-01T09:00:00',
          finishedAt: '2024-01-01T10:00:00',
          duration: 60,
          pagesRead: 30,
          readingSpeed: 30,
        }),
      ]);

      const result: {
        history: { date: string; sessions: Record<string, unknown>[] }[];
        cursor: number | null;
      } = await service.getReadingHistory('user-1', { take: 20 });

      const session = result.history[0].sessions[0];
      expect(session).toMatchObject({
        id: 1,
        duration: 60,
        pagesRead: 30,
        readingSpeed: 30,
        title: 'Test Book',
        author: 'Test Author',
        cover: 'https://example.com/cover.jpg',
      });
    });
  });
});
