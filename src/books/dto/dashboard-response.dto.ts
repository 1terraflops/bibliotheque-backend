import { Expose } from 'class-transformer';
import { BookStatus } from 'generated/prisma/enums';
import { UserBookResponseDto } from './user-book-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @Expose()
  @ApiProperty({
    example: BookStatus.IN_PROGRESS,
    enum: BookStatus,
  })
  status: BookStatus;

  @Expose()
  @ApiProperty()
  books: UserBookResponseDto;
}
