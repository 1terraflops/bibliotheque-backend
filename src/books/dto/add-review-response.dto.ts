import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AddReviewResponseDto {
  @Expose()
  @ApiProperty({
    description: 'ID the of the review',
    example: '12',
  })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'The review of the book',
    example: 'Great book, recommend it',
  })
  review: string;

  @Expose()
  @ApiProperty({
    description: 'Does this review contain spoilers?',
    example: true,
    default: false,
  })
  hasSpoilers: boolean = false;

  @Expose()
  @ApiProperty({
    description: 'Date of review',
    example: '2026-02-18T00:00:00.000Z',
  })
  createdAt: string;
}
