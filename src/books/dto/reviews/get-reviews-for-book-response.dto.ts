import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GetReviewsForBookResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Review for the selected book',
  })
  review!: string;

  @Expose()
  @ApiProperty({
    description: 'If true - review contains spoilers',
    type: Boolean,
    example: true,
  })
  hasSpoilers!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Date when the review was published',
  })
  createdAt!: string;

  @Expose()
  @ApiProperty({
    description: 'Username or fullname of the user who published the review',
  })
  author!: string;
}
