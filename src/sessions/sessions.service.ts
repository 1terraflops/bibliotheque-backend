import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/database/prisma.service';
import { isbnDto } from 'src/types/isbn.dto';
import { StartSessionRequestDto } from './dto/start-session-request-dto';
import { EndSessionRequestDto } from './dto/end-session-request.dto';
import moment from 'moment';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSessionById(id: number) {
    return await this.prisma.sessions.findUnique({
      where: { id },
    });
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
    const { startPage, bookId } = dto;

    const session = await this.getActiveSession(profileId);

    if (session) {
      throw new ConflictException('This book is already being read');
    }

    if (!session)
      return await this.prisma.sessions.create({
        data: {
          startPage,
          bookId,
          profileId,
        },
      });
  }

  async endSession(profileId: string, dto: EndSessionRequestDto) {
    const { id, ...sessionDetails } = dto;

    const session = await this.getSessionById(id);

    if (!session) {
      throw new NotFoundException('This session does not exist');
    }

    if (session.status === SessionStatus.ENDED) {
      throw new ConflictException('This session has already ended');
    }

    const pagesRead = Math.max(
      0,
      sessionDetails.endPage - sessionDetails.startPage,
    );
    const duration = moment(sessionDetails.finishedAt).diff(
      sessionDetails.startedAt,
      'minutes',
    );
    const readingSpeed =
      duration > 0 ? Math.round(pagesRead / (duration / 60)) : 0;

    return await this.prisma.sessions.update({
      where: { profileId, id },
      data: {
        status: SessionStatus.ENDED,
        ...sessionDetails,
        pagesRead,
        duration,
        readingSpeed,
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
