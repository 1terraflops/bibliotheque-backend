import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetReadingOverTimeChartRequestDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;
}
