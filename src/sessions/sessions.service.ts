import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookStatus, SessionStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/database/prisma.service';
import { isbnDto } from 'src/types/isbn.dto';
import { StartSessionRequestDto } from './dto/start-session-request-dto';
import { EndSessionRequestDto } from './dto/end-session-request.dto';
import moment from 'moment';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getSessions(id: string, { isbn }: isbnDto) {
    return await this.prisma.sessions.findMany({
      where: {
        usersBook: { profileId: id, book: { isbn } },
        status: { not: SessionStatus.CANCELLED },
      },
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

    return await this.prisma.sessions.create({
      data: { startPage, bookId, profileId },
    });
  }

  async endSession(profileId: string, dto: EndSessionRequestDto) {
    const session = await this.getActiveSession(profileId);
    if (!session) {
      throw new NotFoundException('No active session');
    }

    const book = await this.prisma.usersBooks.findUnique({
      where: { profileId_bookId: { profileId, bookId: session.bookId } },
    });
    if (!book) {
      throw new NotFoundException('Book not found in user library');
    }

    const { actualPageCount = 0 }: { actualPageCount: number } = book;

    // Session values
    const endPage = Math.min(dto.endPage, actualPageCount);
    const pagesRead = Math.max(0, endPage - dto.startPage);
    const duration = moment(dto.finishedAt).diff(dto.startedAt, 'minutes');
    const readingSpeed =
      duration > 0 ? Math.round(pagesRead / (duration / 60)) : 0;

    // Overall book values
    const totalPagesRead = Math.min(
      (book.pagesRead ?? 0) + pagesRead,
      actualPageCount,
    );
    const totalSpentTime = (book.spentTime ?? 0) + duration;
    const status =
      totalPagesRead === actualPageCount ? BookStatus.COMPLETED : book.status;
    const totalReadingSpeed =
      totalSpentTime > 0
        ? Math.round(totalPagesRead / (totalSpentTime / 60))
        : 0;
    const finishedAt =
      status === BookStatus.COMPLETED
        ? moment().toISOString()
        : book.finishedAt;
    const estimatedTime = this.estimateTimeLeft(
      totalPagesRead,
      actualPageCount,
      totalSpentTime,
    );

    // Updated read book with new info
    await this.prisma.usersBooks.update({
      where: { profileId_bookId: { profileId, bookId: session.bookId } },
      data: {
        status,
        finishedAt,
        estimatedTime,
        pagesRead: totalPagesRead,
        spentTime: totalSpentTime,
        readingSpeed: totalReadingSpeed,
      },
    });

    // End session
    return await this.prisma.sessions.update({
      where: { profileId, id: session.id },
      data: {
        ...dto,
        endPage,
        pagesRead,
        duration,
        readingSpeed,
        status: SessionStatus.ENDED,
      },
    });
  }

  async cancelSession(profileId: string) {
    const session = await this.getActiveSession(profileId);

    if (!session) {
      throw new NotFoundException('Session does not exist');
    }

    return await this.prisma.sessions.update({
      where: { profileId, id: session.id },
      data: { status: SessionStatus.CANCELLED },
    });
  }
}
