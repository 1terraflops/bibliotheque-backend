import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { BookStatus } from 'generated/prisma/enums';
import { SortOrder } from 'generated/prisma/internal/prismaNamespace';

export class GetAllUsersBooksRequestDto {
  @ApiProperty({
    description: 'Filter by reading status',
    example: 'IN_PROGRESS',
    enum: BookStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @ApiProperty({
    description: 'Sorting order',
    example: SortOrder.asc,
    enum: SortOrder,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort?: SortOrder = SortOrder.desc;

  @ApiProperty({
    description: 'The count of the returned items',
    example: 5,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  take?: number = 10;

  @ApiProperty({
    description: "Used with 'take' for pagination",
    example: 1,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @ApiProperty({
    description: "Used to fetch user's favorite books",
    example: true,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFavorite?: boolean = false;
}
