import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsString, Length } from 'class-validator';

export class AddReviewRequestDto {
  @ApiProperty({
    description: 'ID the of the book',
    example: '12',
  })
  @IsNumber()
  id!: number;

  @ApiProperty({
    description: 'The review of the book',
    example: 'Great book, recommend it',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/<[^>]*>/g, '') : value,
  )
  @IsString()
  @Length(1, 2000)
  review!: string;

  @ApiProperty({
    description: 'Does this review contain spoilers?',
    example: true,
    default: false,
  })
  @IsBoolean()
  hasSpoilers: boolean = false;
}
