import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { StandardResponses } from 'src/decorators/standard-responses.decorator';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { StartSessionRequestDto } from './dto/start-session-request-dto';
import { SessionStandardResponseDto } from './dto/session-standard-response.dto';
import { EndSessionRequestDto } from './dto/end-session-request.dto';
import { GetSessionsRequestDto } from './dto/get-sessions-request.dto';
import { GetSessionsPaginatedResponseDto } from './dto/get-sessions-paginated-response.dto';

@Controller({
  version: '1',
  path: 'sessions',
})
@ApiTags('sessions')
@StandardResponses()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @SerializeOptions({ type: GetSessionsPaginatedResponseDto })
  @ApiOkResponse({
    description: 'Sessions returned successfully',
    type: [GetSessionsPaginatedResponseDto],
  })
  getSessions(
    @Query() dto: GetSessionsRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return this.sessionsService.getSessions(id, dto);
  }

  @Get('active')
  @SerializeOptions({ type: SessionStandardResponseDto || null })
  @ApiOkResponse({
    description: 'Sessions returned successfully',
    type: SessionStandardResponseDto || null,
  })
  getActiveSession(@CurrentUser('id') id: string) {
    return this.sessionsService.getActiveSession(id);
  }

  @Post('start')
  @SerializeOptions({ type: SessionStandardResponseDto })
  @ApiOkResponse({
    description: 'Session started successfully',
    type: SessionStandardResponseDto,
  })
  startSession(
    @Body() dto: StartSessionRequestDto,
    @CurrentUser('id') id: string,
  ) {
    return this.sessionsService.startSession(id, dto);
  }

  @Patch('end')
  @SerializeOptions({ type: SessionStandardResponseDto })
  @ApiOkResponse({
    description: 'Session ended successfully',
    type: SessionStandardResponseDto,
  })
  endSession(@Body() dto: EndSessionRequestDto, @CurrentUser('id') id: string) {
    return this.sessionsService.endSession(id, dto);
  }

  @Patch('cancel')
  @SerializeOptions({ type: SessionStandardResponseDto })
  @ApiOkResponse({
    description: 'Session cancelled successfully',
    type: SessionStandardResponseDto,
  })
  cancelSession(@CurrentUser('id') id: string) {
    return this.sessionsService.cancelSession(id);
  }
}
