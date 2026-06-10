import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetReadingHistoryRequestDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    description: 'Id of the last session. Use for pagination',
    example: 12,
    required: false,
  })
  cursor?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    description: 'Number of sessions to return',
    example: 20,
    default: 20,
    required: false,
  })
  take?: number = 20;
}
