import { Module } from '@nestjs/common';
import { PrismaServiceModule } from './database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaServiceModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
  ],
  providers: [AuthService],
})
export class AppModule {}
