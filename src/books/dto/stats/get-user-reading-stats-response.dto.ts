import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetUserReadingStatsResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Number of finished books',
    example: 9,
  })
  booksRead!: number;

  @Expose()
  @ApiProperty({
    description: 'Number of total read pages',
    example: 3153,
  })
  pagesRead!: number;

  @Expose()
  @ApiProperty({
    description: 'Number of total reading sessions',
    example: 23,
  })
  totalSessions!: number;

  @Expose()
  @ApiProperty({
    description: 'Total number of sessions duration in minutes',
    example: 45,
  })
  totalSessionDuration!: number;

  @Expose()
  @ApiProperty({
    description: 'Avg session duration across all sessions in minutes',
    example: 45,
  })
  avgSessionDuration!: number;

  @Expose()
  @ApiProperty({
    description: 'Longest session duration across all sessions in minutes',
    example: 128,
  })
  longestSession!: number;

  @Expose()
  @ApiProperty({
    description: 'Average reading speed across all sessions (pages/hr)',
    example: 21,
  })
  avgReadingSpeed!: number;

  @Expose()
  @ApiProperty({
    description: 'Average number of pages read per session',
    example: 15,
  })
  avgPagesPerSession!: number;

  @Expose()
  @ApiProperty({
    description: 'The most common time of the day for reading by user',
    example: 'evening',
  })
  mostCommonTimeOfTheDay!: string;
}
