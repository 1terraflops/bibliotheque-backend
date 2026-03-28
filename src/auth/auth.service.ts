import { Injectable, UnauthorizedException } from '@nestjs/common';
import { GetTokenDto } from './dto/get-token';
import { supabase } from 'src/_database/supabase';

@Injectable()
export class AuthService {
  async getToken(dto: GetTokenDto) {
    const { error, data } = await supabase.auth.signInWithPassword(dto);

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return data;
  }
}
