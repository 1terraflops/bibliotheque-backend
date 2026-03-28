import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetChartRequestDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}
