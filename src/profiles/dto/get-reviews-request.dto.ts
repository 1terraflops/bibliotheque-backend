import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetReviewsRequestDto {
  @ApiProperty({
    description: 'Number of returned reviews per page',
    default: 10,
    example: 15,
  })
  @Type(() => Number)
  @IsNumber()
  take: number = 10;

  @ApiProperty({
    description: 'Id of the last element, used for pagination',
    example: 16,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  cursor?: number;
}
