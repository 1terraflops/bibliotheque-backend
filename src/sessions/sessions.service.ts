import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookStatus, SessionStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/_database/prisma.service';
import { StartSessionRequestDto } from './dto/start-session-request-dto';
import { EndSessionRequestDto } from './dto/end-session-request.dto';
import moment from 'moment';
import { Sessions } from 'generated/prisma/browser';
import { GetSessionsRequestDto } from './dto/get-sessions-request.dto';
import { UsersBooks } from 'generated/prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getSessions(
    id: string,
    { isbn, cursor, take = 20 }: GetSessionsRequestDto,
  ) {
    const rows = await this.prisma.sessions.findMany({
      where: {
        usersBook: { profileId: id, book: { isbn } },
        status: { not: SessionStatus.CANCELLED },
      },
      orderBy: { startedAt: 'desc' },
      take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    return {
      data: this.compareWithPrevious(rows),
      nextCursor:
        rows.length === take ? (rows[rows.length - 1]?.id ?? null) : null,
    };
  }

  private compareWithPrevious(sessions: Sessions[]) {
    const lastIndex = sessions.length - 1;
    return sessions.map((session, index) => {
      if (index === lastIndex) {
        return { ...session, improvedFromPrevious: null };
      }
      const prev = sessions[index + 1];

      const cmp = (a: number, b: number) => (a > b ? 1 : a < b ? -1 : 0);

      const scores = [
        cmp(session.pagesRead ?? 0, prev.pagesRead ?? 0),
        cmp(session.duration ?? 0, prev.duration ?? 0),
        cmp(session.readingSpeed ?? 0, prev.readingSpeed ?? 0),
      ];

      const total = scores.reduce((sum, v) => sum + v, 0);
      const improvedFromPrevious = total === 0 ? null : total > 0;

      return { ...session, improvedFromPrevious };
    });
  }

  async getActiveSession(profileId: string) {
    return this.prisma.sessions.findFirst({
      where: {
        usersBook: { profileId },
        status: SessionStatus.STARTED,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async startSession(profileId: string, dto: StartSessionRequestDto) {
    const activeSession = await this.getActiveSession(profileId);
    if (activeSession) {
      this.logger.warn(
        'Attempted to start a session while one is already active',
        {
          context: SessionsService.name,
          profileId,
          activeSessionId: activeSession.id,
        },
      );
      throw new ConflictException('You already have an active session');
    }

    const { startPage, bookId } = dto;

    const book = await this.prisma.usersBooks.findUnique({
      where: { profileId_bookId: { profileId, bookId } },
      include: { sessions: true },
    });
    if (!book) {
      throw new NotFoundException('Book not found in user library');
    }

    const isFirstSession = !book.sessions.length;
    const isCompleted = book.status === BookStatus.COMPLETED;
    const isNotInProgress = book.status !== BookStatus.IN_PROGRESS;

    await this.prisma.usersBooks.update({
      where: { profileId_bookId: { profileId, bookId } },
      data: {
        ...(isFirstSession && { startedAt: moment().toISOString() }),
        ...(isCompleted && {
          pagesRead: startPage,
          startedAt: moment().toISOString(),
          finishedAt: null,
          spentTime: 0,
          estimatedTime: null,
        }),
        ...(isNotInProgress && { status: BookStatus.IN_PROGRESS }),
      },
    });

    const session = await this.prisma.sessions.create({
      data: { startPage, bookId, profileId },
    });

    this.logger.info('Session started', {
      context: SessionsService.name,
      profileId,
      bookId,
      sessionId: session.id,
      isFirstSession,
      resumedAfterCompletion: isCompleted,
    });

    return session;
  }

  async endSession(profileId: string, dto: EndSessionRequestDto) {
    const session = await this.getActiveSession(profileId);
    if (!session) throw new NotFoundException('No active session');

    const book = await this.prisma.usersBooks.findUnique({
      where: { profileId_bookId: { profileId, bookId: session.bookId } },
    });
    if (!book) throw new NotFoundException('Book not found in user library');

    const sessionStats = this.calcSessionStats(dto, book.actualPageCount ?? 0);
    const bookUpdate = this.calcBookUpdate(book, sessionStats);

    await this.prisma.usersBooks.update({
      where: { profileId_bookId: { profileId, bookId: session.bookId } },
      data: bookUpdate,
    });

    const ended = await this.prisma.sessions.update({
      where: { profileId, id: session.id },
      data: { ...dto, ...sessionStats, status: SessionStatus.ENDED },
    });

    this.logger.info('Session ended', {
      context: SessionsService.name,
      profileId,
      sessionId: session.id,
      pagesRead: sessionStats.pagesRead,
      duration: sessionStats.duration,
      bookCompleted: bookUpdate.status === BookStatus.COMPLETED,
    });

    return ended;
  }

  private calcSessionStats(dto: EndSessionRequestDto, actualPageCount: number) {
    const endPage = Math.min(dto.endPage, actualPageCount);
    const pagesRead = Math.max(0, endPage - dto.startPage);
    const duration = moment(dto.finishedAt).diff(dto.startedAt, 'minutes');
    const readingSpeed =
      duration > 0 ? Math.round(pagesRead / (duration / 60)) : 0;
    return { endPage, pagesRead, duration, readingSpeed };
  }

  private calcBookUpdate(
    book: UsersBooks,
    session: {
      endPage: number;
      pagesRead: number;
      duration: number;
      readingSpeed: number;
    },
  ) {
    const totalPagesRead = Math.min(
      (book.pagesRead ?? 0) + session.pagesRead,
      book.actualPageCount ?? 0,
    );
    const totalSpentTime = (book.spentTime ?? 0) + session.duration;
    const status =
      session.endPage >= (book.actualPageCount ?? 0)
        ? BookStatus.COMPLETED
        : book.status;
    const readingSpeed =
      totalSpentTime > 0
        ? Math.round(totalPagesRead / (totalSpentTime / 60))
        : 0;
    const finishedAt =
      status === BookStatus.COMPLETED
        ? moment().toISOString()
        : book.finishedAt;
    const estimatedTime = this.estimateTimeLeft(
      session.endPage,
      book.actualPageCount ?? 0,
      totalSpentTime,
    );

    return {
      status,
      finishedAt,
      estimatedTime,
      pagesRead: session.endPage,
      spentTime: totalSpentTime,
      readingSpeed,
    };
  }

  private estimateTimeLeft(
    pagesRead: number,
    pageCount: number,
    duration: number,
  ): number {
    if (pagesRead === 0) return 0;

    const pagesPerMinute = pagesRead / duration;
    const pagesLeft = pageCount - pagesRead;

    return Math.round(pagesLeft / pagesPerMinute);
  }

  async cancelSession(profileId: string) {
    const session = await this.getActiveSession(profileId);

    if (!session) {
      throw new NotFoundException('Session does not exist');
    }

    this.logger.info('Session cancelled', {
      context: SessionsService.name,
      profileId,
      sessionId: session.id,
    });

    return await this.prisma.sessions.update({
      where: { profileId, id: session.id },
      data: { status: SessionStatus.CANCELLED },
    });
  }
}
