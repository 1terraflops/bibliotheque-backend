import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SessionsService } from './sessions.service';
import { PrismaService } from 'src/_database/prisma.service';
import { BookStatus, SessionStatus } from 'generated/prisma/enums';

const mockSession = {
  id: 1,
  profileId: 'user-1',
  bookId: 1,
  startPage: 0,
  endPage: null,
  pagesRead: null,
  duration: null,
  readingSpeed: null,
  status: SessionStatus.STARTED,
  startedAt: new Date('2024-01-01T09:00:00'),
  finishedAt: null,
};

const mockEndedSession = {
  ...mockSession,
  status: SessionStatus.ENDED,
  endPage: 50,
  pagesRead: 50,
  duration: 60,
  readingSpeed: 50,
  finishedAt: new Date('2024-01-01T10:00:00'),
};

const mockUsersBook = {
  profileId: 'user-1',
  bookId: 1,
  status: BookStatus.IN_PROGRESS,
  pagesRead: 0,
  spentTime: 0,
  actualPageCount: 300,
  finishedAt: null,
  sessions: [],
};

const mockPrisma = {
  sessions: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  usersBooks: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSessions', () => {
    const id = 'user-1';

    it('returns sessions with improvedFromPrevious and nextCursor', async () => {
      const sessions = [
        {
          ...mockEndedSession,
          id: 1,
          pagesRead: 50,
          duration: 60,
          readingSpeed: 50,
        },
        {
          ...mockEndedSession,
          id: 2,
          pagesRead: 30,
          duration: 60,
          readingSpeed: 30,
        },
      ];
      mockPrisma.sessions.findMany.mockResolvedValue(sessions);

      const result = await service.getSessions(id, {
        isbn: '9786175480083',
        take: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].improvedFromPrevious).toBe(true);
      expect(result.data[1].improvedFromPrevious).toBeNull();
    });

    it('returns nextCursor when rows equal take', async () => {
      const sessions = Array.from({ length: 20 }, (_, i) => ({
        ...mockEndedSession,
        id: i + 1,
      }));
      mockPrisma.sessions.findMany.mockResolvedValue(sessions);

      const result = await service.getSessions(id, {
        isbn: '9786175480083',
        take: 20,
      });

      expect(result.nextCursor).toBe(20);
    });

    it('returns null cursor when rows are fewer than take', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([mockEndedSession]);

      const result = await service.getSessions(id, {
        isbn: '9786175480083',
        take: 20,
      });

      expect(result.nextCursor).toBeNull();
    });

    it('includes cursor and skip when cursor is provided', async () => {
      mockPrisma.sessions.findMany.mockResolvedValue([]);

      await service.getSessions(id, {
        isbn: '9786175480083',
        take: 20,
        cursor: 5,
      });

      expect(mockPrisma.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 5 }, skip: 1 }),
      );
    });

    it('sets improvedFromPrevious to null when scores are equal', async () => {
      const sessions = [
        {
          ...mockEndedSession,
          id: 1,
          pagesRead: 50,
          duration: 60,
          readingSpeed: 50,
        },
        {
          ...mockEndedSession,
          id: 2,
          pagesRead: 50,
          duration: 60,
          readingSpeed: 50,
        },
      ];
      mockPrisma.sessions.findMany.mockResolvedValue(sessions);

      const result = await service.getSessions(id, {
        isbn: '9786175480083',
        take: 20,
      });

      expect(result.data[0].improvedFromPrevious).toBeNull();
    });

    it('sets improvedFromPrevious to false when session is worse', async () => {
      const sessions = [
        {
          ...mockEndedSession,
          id: 1,
          pagesRead: 10,
          duration: 30,
          readingSpeed: 10,
        },
        {
          ...mockEndedSession,
          id: 2,
          pagesRead: 50,
          duration: 60,
          readingSpeed: 50,
        },
      ];
      mockPrisma.sessions.findMany.mockResolvedValue(sessions);

      const result = await service.getSessions(id, {
        isbn: '9786175480083',
        take: 20,
      });

      expect(result.data[0].improvedFromPrevious).toBe(false);
    });
  });

  describe('startSession', () => {
    const profileId = 'user-1';
    const dto = { startPage: 1, bookId: 1 };

    it('creates and returns a new session', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(null);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(mockUsersBook);
      mockPrisma.usersBooks.update.mockResolvedValue(mockUsersBook);
      mockPrisma.sessions.create.mockResolvedValue(mockSession);

      const result = await service.startSession(profileId, dto);

      expect(result).toEqual(mockSession);
      expect(mockPrisma.sessions.create).toHaveBeenCalledWith({
        data: { startPage: dto.startPage, bookId: dto.bookId, profileId },
      });
    });

    it('logs and throws ConflictException when session is already active', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(mockSession);

      await expect(service.startSession(profileId, dto)).rejects.toThrow(
        new ConflictException('You already have an active session'),
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Attempted to start a session while one is already active',
        expect.objectContaining({ profileId, activeSessionId: mockSession.id }),
      );
      expect(mockPrisma.sessions.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when book not in library', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(null);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(null);

      await expect(service.startSession(profileId, dto)).rejects.toThrow(
        new NotFoundException('Book not found in user library'),
      );

      expect(mockPrisma.sessions.create).not.toHaveBeenCalled();
    });

    it('logs after session is created', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(null);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(mockUsersBook);
      mockPrisma.usersBooks.update.mockResolvedValue(mockUsersBook);
      mockPrisma.sessions.create.mockResolvedValue(mockSession);

      await service.startSession(profileId, dto);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Session started',
        expect.objectContaining({
          profileId,
          bookId: dto.bookId,
          sessionId: mockSession.id,
        }),
      );
    });
  });

  describe('endSession', () => {
    const profileId = 'user-1';
    const dto = {
      startPage: 0,
      endPage: 50,
      startedAt: '2024-01-01T09:00:00',
      finishedAt: '2024-01-01T10:00:00',
    };

    it('throws NotFoundException when no active session', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(null);

      await expect(service.endSession(profileId, dto)).rejects.toThrow(
        new NotFoundException('No active session'),
      );

      expect(mockPrisma.sessions.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when book not found', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(mockSession);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(null);

      await expect(service.endSession(profileId, dto)).rejects.toThrow(
        new NotFoundException('Book not found in user library'),
      );
    });

    it('logs after session ends', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(mockSession);
      mockPrisma.usersBooks.findUnique.mockResolvedValue(mockUsersBook);
      mockPrisma.usersBooks.update.mockResolvedValue(mockUsersBook);
      mockPrisma.sessions.update.mockResolvedValue(mockEndedSession);

      await service.endSession(profileId, dto);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Session ended',
        expect.objectContaining({ profileId, sessionId: mockSession.id }),
      );
    });
  });

  describe('cancelSession', () => {
    const profileId = 'user-1';

    it('cancels the active session', async () => {
      const cancelled = { ...mockSession, status: SessionStatus.CANCELLED };
      mockPrisma.sessions.findFirst.mockResolvedValue(mockSession);
      mockPrisma.sessions.update.mockResolvedValue(cancelled);

      const result = await service.cancelSession(profileId);

      expect(result).toEqual(cancelled);
      expect(mockPrisma.sessions.update).toHaveBeenCalledWith({
        where: { profileId, id: mockSession.id },
        data: { status: SessionStatus.CANCELLED },
      });
    });

    it('throws NotFoundException when no active session', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(null);

      await expect(service.cancelSession(profileId)).rejects.toThrow(
        new NotFoundException('Session does not exist'),
      );

      expect(mockPrisma.sessions.update).not.toHaveBeenCalled();
    });

    it('logs after session is cancelled', async () => {
      mockPrisma.sessions.findFirst.mockResolvedValue(mockSession);
      mockPrisma.sessions.update.mockResolvedValue({
        ...mockSession,
        status: SessionStatus.CANCELLED,
      });

      await service.cancelSession(profileId);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Session cancelled',
        expect.objectContaining({ profileId, sessionId: mockSession.id }),
      );
    });
  });
});
