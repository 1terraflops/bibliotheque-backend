import {
  Controller,
  Get,
  Param,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CurrentUser } from 'src/_decorators/current-user.decorator';
import { ApiOkResponse } from '@nestjs/swagger';
import { GetReviewsRequestDto } from './dto/get-reviews-request.dto';
import { GetReviewsPaginatedResponseDto } from './dto/get-reviews-paginated-response.dto';

@Controller({
  path: 'profiles',
  version: '1',
})
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me/reviews')
  @SerializeOptions({ type: GetReviewsPaginatedResponseDto })
  @ApiOkResponse({
    description: 'Reviews returned successfully',
    type: [GetReviewsPaginatedResponseDto],
  })
  getMyReviews(
    @Query() dto: GetReviewsRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return this.profilesService.getMyReviews(dto, id);
  }

  @Get(':username/reviews')
  @SerializeOptions({ type: GetReviewsPaginatedResponseDto })
  @ApiOkResponse({
    description: 'Reviews returned successfully',
    type: [GetReviewsPaginatedResponseDto],
  })
  getUserReviews(
    @Param('username') username: string,
    @Query() dto: GetReviewsRequestDto,
  ) {
    return this.profilesService.getUserReviews(dto, username);
  }
}
