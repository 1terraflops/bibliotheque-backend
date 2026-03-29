import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/_database/prisma.service';
import { GetReviewsRequestDto } from './dto/get-reviews-request.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  private async fetchReviews(
    where: Prisma.BooksReviewsWhereInput,
    dto: GetReviewsRequestDto,
  ) {
    const { cursor, take } = dto;

    const rows = await this.prisma.booksReviews.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { book: true },
      take: take + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasNextPage = rows.length > take;
    if (hasNextPage) rows.pop();

    return {
      items: rows,
      nextCursor: hasNextPage ? rows[rows.length - 1].id : null,
    };
  }

  async getMyReviews(dto: GetReviewsRequestDto, profileId: string) {
    return this.fetchReviews({ profileId }, dto);
  }

  async getUserReviews(dto: GetReviewsRequestDto, username: string) {
    return this.fetchReviews({ profile: { username } }, dto);
  }
}
