import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HeatmapItemDto {
  @Expose()
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2026-06-09',
  })
  date: string;

  @Expose()
  @ApiProperty({
    description: 'Hours read on this date',
    example: 1.5,
  })
  count: number;
}

export class GetHeatmapDataResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Array of heatmap items with date and count',
    type: [HeatmapItemDto],
  })
  heatmapData: HeatmapItemDto[];
}
