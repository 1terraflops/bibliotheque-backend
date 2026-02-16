import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GetTokenDto } from './dto/get-token';
import { Public } from 'src/decorators/public.decorator';

@Public()
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('get-token')
  getToken(@Body() dto: GetTokenDto) {
    return this.authService.getToken(dto);
  }
}
