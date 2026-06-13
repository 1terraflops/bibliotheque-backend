import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GetTokenDto } from './dto/get-token';
import { Public } from 'src/_decorators/public.decorator';
import {
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

// auth is handled by supabase
@Public()
@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('get-token')
  @ApiCreatedResponse({
    description: 'Logged in successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  getToken(@Body() dto: GetTokenDto) {
    return this.authService.getToken(dto);
  }
}
