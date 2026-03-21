import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SessionStatus } from 'generated/prisma/enums';

export class SessionStandardResponseDto {
  @Expose()
  @ApiProperty({
    example: 5,
    type: Number,
  })
  id: number;

  @Expose()
  @ApiProperty({
    example: 5,
    type: Number,
  })
  bookId: number;

  @Expose()
  @ApiProperty({
    description: 'Current session status of the book',
    example: SessionStatus.ENDED,
    enum: SessionStatus,
  })
  status: SessionStatus;

  @Expose()
  @ApiProperty({
    description: 'Session start time',
    type: String,
  })
  startedAt: string;

  @Expose()
  @ApiProperty({
    description: 'Session finish time',
    type: String,
    nullable: true,
  })
  finishedAt: string;

  @Expose()
  @ApiProperty({
    description: 'Session start page',
    type: Number,
  })
  startPage: number;

  @Expose()
  @ApiProperty({
    description: 'Session end page',
    type: Number,
    nullable: true,
  })
  endPage: number;

  @Expose()
  @ApiProperty({
    description: 'Total pages read during the session',
    type: Number,
    nullable: true,
  })
  pagesRead: number;

  @Expose()
  @ApiProperty({
    description: 'Total reading time during the session',
    type: Number,
    nullable: true,
  })
  duration: number;

  @Expose()
  @ApiProperty({
    description: 'Reading speed in the session',
    type: Number,
    nullable: true,
  })
  readingSpeed: number;
}
