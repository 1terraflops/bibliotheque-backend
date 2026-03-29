import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { GetReviewsResponseDto } from './get-reviews-response.dto';

export class GetReviewsPaginatedResponseDto {
  @Expose()
  @ApiProperty({ type: [GetReviewsResponseDto] })
  @Type(() => GetReviewsResponseDto)
  items: GetReviewsResponseDto[];

  @Expose()
  @ApiProperty({ nullable: true, example: 16 })
  nextCursor: number | null;
}
