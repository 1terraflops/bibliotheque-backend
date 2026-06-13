import { Injectable } from '@nestjs/common';
import { BookStatus, Sessions, SessionStatus } from 'generated/prisma/client';
import moment from 'moment';
import { PrismaService } from 'src/_database/prisma.service';
import { GetReadingHistoryRequestDto } from './dto/stats/get-reading-history-request.dto';
import { findAvg } from 'src/_helpers/findAverage';
import { GetReadingOverTimeChartRequestDto } from './dto/stats/get-reading-over-time-chart-request.dto';

@Injectable()
export class ReadingStatsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const booksRead = userBooks.filter(
      (b) => b.status === BookStatus.COMPLETED,
    ).length;

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

  async getReadingOverTimeChart(
    profileId: string,
    dto: GetReadingOverTimeChartRequestDto,
  ) {
    const rows = await this.prisma.sessions.findMany({
      where: {
        profileId,
        bookId: dto.id,
        status: SessionStatus.ENDED,
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    if (rows.length < 2) {
      return {
        pages: { data: [], avg: 0 },
        durations: { data: [], avg: 0 },
        speeds: { data: [], avg: 0 },
      };
    }

    const sessions = rows.reverse();

    const pages = sessions.map((session) => session.pagesRead);
    const durations = sessions.map((session) => session.duration);
    const speeds = sessions.map((session) => session.readingSpeed);

    const avgPages = findAvg(pages);
    const avgDuration = findAvg(durations);
    const avgSpeed = findAvg(speeds);

    return {
      pages: {
        data: pages,
        avg: avgPages,
      },
      durations: {
        data: durations,
        avg: avgDuration,
      },
      speeds: {
        data: speeds,
        avg: avgSpeed,
      },
    };
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
        const date = session.startedAt.toISOString().split('T')[0];

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
}
