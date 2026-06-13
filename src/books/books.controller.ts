import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { GetBookByISBNRequestDto } from './dto/books/get-book-by-isbn-request.dto';
import { AddBookByISBNRequestDto } from './dto/books/add-book-request.dto';
import { BookResponseDto } from './dto/books/book-response.dto';
import { CurrentUser } from 'src/_decorators/current-user.decorator';
import { UserBookResponseDto } from './dto/books/user-book-response.dto';
import { DeleteBookRequestDto } from './dto/books/delete-book-request.dto';
import { UpdateBookRequestDto } from './dto/books/update-book-request.dto';
import { isbnDto } from '../_types/isbn.dto';
import { GetAllUsersBooksRequestDto } from './dto/books/get-all-users-books-request.dto';
import { Throttle } from '@nestjs/throttler';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StandardResponses } from 'src/_decorators/standard-responses.decorator';
import { DashboardResponseDto } from './dto/books/dashboard-response.dto';
import { AddReviewResponseDto } from './dto/reviews/add-review-response.dto';
import { AddReviewRequestDto } from './dto/reviews/add-review-request.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileValidationPipe } from 'src/_pipes/file-validation.pipe';
import { GetUserReadingStatsResponseDto } from './dto/stats/get-user-reading-stats-response.dto';
import { GetHeatmapDataResponseDto } from './dto/stats/get-heatmap-data-response.dto';
import { GetReadingHistoryRequestDto } from './dto/stats/get-reading-history-request.dto';
import { GetReadingHistoryResponseDto } from './dto/stats/get-reading-history-respose.dto';
import { GetReviewsForBookResponseDto } from './dto/reviews/get-reviews-for-book-response.dto';
import { GetBookByNameRequestDto } from './dto/books/get-book-by-name-request.dto';
import { GoogleBooksService } from './google-books.service';
import { ReadingStatsService } from './reading-stats.service';
import { BookReviewsService } from './book-reviews.service';
import { GetReadingOverTimeChartRequestDto } from './dto/stats/get-reading-over-time-chart-request.dto';
import { GetReadingOverTimeChartResponseDto } from './dto/stats/get-reading-over-time-chart-response.dto';

@ApiTags('books')
@StandardResponses()
@Controller({
  path: 'books',
  version: '1',
})
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly googleBooksService: GoogleBooksService,
    private readonly readingStatsService: ReadingStatsService,
    private readonly bookReviewsService: BookReviewsService,
  ) {}

  @Get()
  @SerializeOptions({ type: BookResponseDto })
  @ApiOkResponse({
    description: 'Book returned successfully',
    type: BookResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cannot find this book',
  })
  @Throttle({ default: { ttl: 2000, limit: 1 } })
  async findBook(@Query() dto: GetBookByISBNRequestDto) {
    return await this.booksService.findBook(dto);
  }

  @Get('name')
  @SerializeOptions({ type: BookResponseDto })
  @ApiOkResponse({
    description: 'Book returned successfully',
    type: [BookResponseDto],
  })
  @Throttle({ default: { ttl: 1000, limit: 1 } })
  async findByName(@Query() dto: GetBookByNameRequestDto) {
    return this.googleBooksService.findByNameInGoogleBooks(dto);
  }

  @Get('users-book/:isbn')
  @SerializeOptions({ type: UserBookResponseDto })
  @ApiOkResponse({
    description: 'Book returned successfully',
    type: UserBookResponseDto,
  })
  async getUsersBook(@Param() dto: isbnDto, @CurrentUser('id') id: string) {
    return await this.booksService.findUsersBook(dto, id);
  }

  @Get('all-users-books')
  @SerializeOptions({ type: UserBookResponseDto })
  @ApiOkResponse({
    description: 'Books returned successfully',
    type: [UserBookResponseDto],
  })
  async getAllBooks(
    @Query() dto: GetAllUsersBooksRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.findAllUsersBooks(dto, id);
  }

  @Get('dashboard')
  @SerializeOptions({ type: DashboardResponseDto })
  @ApiOkResponse({
    description: 'Get books with statuses for dashboard',
    type: [DashboardResponseDto],
  })
  async getDashboard(@CurrentUser('id') id: string) {
    return this.booksService.getDashboard(id);
  }

  @Get('stats')
  @SerializeOptions({ type: GetUserReadingStatsResponseDto })
  @ApiOkResponse({
    description: 'Get reading stats for current user',
    type: GetUserReadingStatsResponseDto,
  })
  async getUserReadingStats(@CurrentUser('id') profileId: string) {
    return this.readingStatsService.getUserReadingStats(profileId);
  }

  @Get('stats/reading-over-time-chart/:id')
  @SerializeOptions({ type: GetReadingOverTimeChartResponseDto })
  @ApiOkResponse({
    description: 'Chart data returned successfully',
    type: GetReadingOverTimeChartResponseDto,
  })
  getChart(
    @Param() dto: GetReadingOverTimeChartRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return this.readingStatsService.getReadingOverTimeChart(id, dto);
  }

  @Get('stats/heatmap')
  @SerializeOptions({ type: GetHeatmapDataResponseDto })
  @ApiOkResponse({
    description: 'Get reading stats for current user',
    type: GetHeatmapDataResponseDto,
  })
  async getUserReadingHeatmapData(@CurrentUser('id') profileId: string) {
    return this.readingStatsService.getUserReadingHeatmapData(profileId);
  }

  @Get('reading-history')
  @SerializeOptions({ type: GetReadingHistoryResponseDto })
  @ApiOkResponse({
    description: 'Get reading history for current user',
    type: GetReadingHistoryResponseDto,
  })
  async getReadingHistory(
    @CurrentUser('id') profileId: string,
    @Query() dto: GetReadingHistoryRequestDto,
  ) {
    return this.readingStatsService.getReadingHistory(profileId, dto);
  }

  @Get('book-reviews/:isbn')
  @SerializeOptions({ type: GetReviewsForBookResponseDto })
  @ApiOkResponse({
    description: 'Reviews returned successfully',
    type: [GetReviewsForBookResponseDto],
  })
  async getReviewsForBook(@Param('isbn') isbn: string) {
    return await this.bookReviewsService.getReviewsForBook(isbn);
  }

  @Post()
  @SerializeOptions({ type: UserBookResponseDto })
  @ApiCreatedResponse({
    description: 'Book added successfully',
    type: UserBookResponseDto,
  })
  @ApiConflictResponse({
    description: 'This user already has this book',
  })
  async addBook(
    @Body() dto: AddBookByISBNRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return await this.booksService.addBookToProfile(dto, userId);
  }

  @Post('review')
  @SerializeOptions({ type: AddReviewResponseDto })
  @ApiCreatedResponse({
    description: 'Review added successfully',
    type: AddReviewResponseDto,
  })
  @ApiConflictResponse({
    description: 'The review already exists for this book',
  })
  async addReview(
    @Body() dto: AddReviewRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.bookReviewsService.addReview(dto, id);
  }

  @Patch('cover/:id')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadBookCover(
    @Param('id') id: number,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @CurrentUser('id') profileId: string,
  ) {
    return await this.booksService.uploadBookCover(file, id, profileId);
  }

  @Patch(':isbn')
  @SerializeOptions({ type: UserBookResponseDto })
  @ApiOkResponse({
    description: 'Book updated successfully',
    type: UserBookResponseDto,
  })
  async updateUsersBook(
    @Body() dto: UpdateBookRequestDto,
    @Param() isbnDto: isbnDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.updateUsersBook(dto, isbnDto, id);
  }

  @Delete(':isbn')
  @ApiNoContentResponse({
    description: 'Book deleted successfully',
  })
  async deleteBookFromProfile(
    @Param() dto: DeleteBookRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return await this.booksService.deleteBookFromProfile(dto, id);
  }
}
