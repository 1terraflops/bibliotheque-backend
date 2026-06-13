import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { HttpModule } from '@nestjs/axios';
import { GoogleBooksService } from './google-books.service';
import { ReadingStatsService } from './reading-stats.service';
import { BookReviewsService } from './book-reviews.service';

@Module({
  imports: [HttpModule],
  controllers: [BooksController],
  providers: [
    BooksService,
    GoogleBooksService,
    ReadingStatsService,
    BookReviewsService,
  ],
})
export class BooksModule {}
