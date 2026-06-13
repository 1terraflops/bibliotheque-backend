import { Injectable } from '@nestjs/common';
import { AddReviewRequestDto } from './dto/reviews/add-review-request.dto';
import { PrismaService } from 'src/_database/prisma.service';

@Injectable()
export class BookReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async addReview(dto: AddReviewRequestDto, profileId: string) {
    const { id, review, hasSpoilers } = dto;

    return await this.prisma.booksReviews.upsert({
      where: { profileId_bookId: { profileId, bookId: id } },
      create: { profileId, bookId: id, review, hasSpoilers },
      update: { review, hasSpoilers },
    });
  }

  async getReviewsForBook(isbn: string) {
    const rows = await this.prisma.booksReviews.findMany({
      where: { book: { isbn } },
      include: { profile: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      review: r.review,
      hasSpoilers: r.hasSpoilers,
      createdAt: r.createdAt,
      author: r.profile.full_name ?? r.profile.username,
    }));
  }
}
