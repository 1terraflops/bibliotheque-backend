import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BookResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
  })
  id!: number;

  @Expose()
  @ApiProperty({
    example: '9786175480083',
  })
  isbn!: string;

  @ApiProperty({
    example: '1984',
  })
  @Expose()
  title!: string;

  @ApiProperty({
    example: 'George Orwell',
  })
  @Expose()
  author!: string;

  @ApiProperty({
    example: 'Long description...',
  })
  @Expose()
  description!: string;

  @ApiProperty({
    example: 356,
  })
  @Expose()
  pageCount!: number;

  @ApiProperty({
    example: '',
  })
  @Expose()
  coverUrl!: string;
}
