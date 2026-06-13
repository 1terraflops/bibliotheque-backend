import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

class ChartMetricDto {
  @ApiProperty({ example: [20, 25, 18, 29, 30, 12, 27, 19, 20, 21] })
  data!: number[];

  @ApiProperty({ example: 22.1 })
  avg!: number;
}

export class GetReadingOverTimeChartResponseDto {
  @Expose()
  @ApiProperty({
    type: ChartMetricDto,
    description: 'Amount of read pages of last 10 sessions',
  })
  pages!: ChartMetricDto;

  @Expose()
  @ApiProperty({
    type: ChartMetricDto,
    description: 'Durations of last 10 sessions',
  })
  durations!: ChartMetricDto;

  @Expose()
  @ApiProperty({
    type: ChartMetricDto,
    description: 'Reading speeds of last 10 sessions',
  })
  speeds!: ChartMetricDto;
}
