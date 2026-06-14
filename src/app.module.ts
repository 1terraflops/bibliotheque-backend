import { Module } from '@nestjs/common';
import { PrismaServiceModule } from './_database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './_guards/auth.guard';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SessionsModule } from './sessions/sessions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { StorageModule } from './_storage/storage.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger';

@Module({
  imports: [
    AuthModule,
    BooksModule,
    PrismaServiceModule,
    StorageModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 10,
      },
    ]),
    SessionsModule,
    ProfilesModule,
    WinstonModule.forRoot(winstonConfig),
  ],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
