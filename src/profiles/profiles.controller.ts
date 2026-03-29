import {
  Controller,
  Delete,
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
import { GetReviewsResponseDto } from './dto/get-reviews-response.dto';

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

  @Delete('review/:id')
  @SerializeOptions({ type: GetReviewsResponseDto })
  @ApiOkResponse({
    description: 'Review deleted successfully',
    type: [GetReviewsPaginatedResponseDto],
  })
  deleteReview(@Param('id') id: number, @CurrentUser('id') profileId: string) {
    return this.profilesService.deleteReview(id, profileId);
  }
}
