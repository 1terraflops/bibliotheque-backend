import { Module } from '@nestjs/common';
import { PrismaServiceModule } from './database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    PrismaServiceModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BooksModule,
  ],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
