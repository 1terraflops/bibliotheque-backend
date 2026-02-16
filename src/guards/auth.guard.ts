import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '@supabase/supabase-js';
import { supabase } from 'src/database/supabase';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = data.user;
    return true;
  }
}
