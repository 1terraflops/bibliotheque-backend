import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class ReadingHistoryItem {
  @Expose()
  @ApiProperty({
    description: 'Id of the session',
    example: 12,
  })
  id!: number;

  @Expose()
  @ApiProperty({
    description: 'The time when the session started',
    example: '2023-01-01T00:00:00.000Z',
  })
  startedAt!: string;

  @Expose()
  @ApiProperty({
    description: 'The time when the session finished',
    example: '2023-01-01T01:00:00.000Z',
  })
  finishedAt!: string;

  @Expose()
  @ApiProperty({
    description: 'The duration of the session in minutes',
    example: 60,
  })
  duration!: number;

  @Expose()
  @ApiProperty({
    description: 'The reading speed in pages per hour',
    example: 30,
  })
  readingSpeed!: number;

  @Expose()
  @ApiProperty({
    description: 'The number of pages read during the session',
    example: 12,
  })
  pagesRead!: number;

  @Expose()
  @ApiProperty({
    description: 'The title of the book',
    example: 'The Great Gatsby',
  })
  title!: string;

  @Expose()
  @ApiProperty({
    description: 'The author of the book',
    example: 'F. Scott Fitzgerald',
  })
  author!: string;

  @Expose()
  @ApiProperty({
    description: 'The cover image of the book',
    example: 'https://example.com/cover.jpg',
  })
  cover!: string;
}

class ReadingHistoryGroup {
  @Expose()
  @ApiProperty({
    description: 'Date of sessions (YYYY-MM-DD)',
    example: '2026-06-11',
  })
  date!: string;

  @Expose()
  @Type(() => ReadingHistoryItem)
  @ApiProperty({
    description: 'Sessions for this date',
    type: [ReadingHistoryItem],
  })
  sessions!: ReadingHistoryItem[];
}

export class GetReadingHistoryResponseDto {
  @Expose()
  @Type(() => ReadingHistoryGroup)
  @ApiProperty({
    description: "User's reading history grouped by date",
    type: [ReadingHistoryGroup],
  })
  history!: ReadingHistoryGroup[];

  @Expose()
  @ApiProperty({
    description: 'Id of the last session. Use for pagination',
    example: 12,
    required: false,
    nullable: true,
  })
  cursor!: number | null;
}
