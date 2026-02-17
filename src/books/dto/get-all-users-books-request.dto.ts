import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { BookStatus } from 'generated/prisma/enums';
import { SortOrder } from 'generated/prisma/internal/prismaNamespace';

export class GetAllUsersBooksRequestDto {
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @IsOptional()
  @IsEnum(SortOrder)
  sort?: SortOrder = SortOrder.desc;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  take?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
