import { IsEnum, IsOptional } from 'class-validator';
import { BookStatus } from 'generated/prisma/enums';

export class GetAllUsersBooksRequestDto {
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;
}
