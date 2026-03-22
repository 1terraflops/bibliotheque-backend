import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SessionStandardResponseDto } from './session-standard-response.dto';

export class GetSessionsPaginatedResponseDto {
  @Expose()
  @Type(() => SessionStandardResponseDto)
  @ApiProperty({
    description: 'List of sessions',
    type: [SessionStandardResponseDto],
  })
  data: SessionStandardResponseDto[];

  @Expose()
  @ApiProperty({
    description: 'Id of the last session. Pass as cursor for next page',
    type: Number,
    nullable: true,
    example: 12,
  })
  nextCursor: number | null;
}
