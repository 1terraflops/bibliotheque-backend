import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { OperationObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Books++')
    .setDescription('Books++ API documentation')
    .setVersion('1')
    .addTag('books')
    .build();

  const document = () => {
    const doc = SwaggerModule.createDocument(app, swaggerConfig, {
      operationIdFactory: (_, methodKey: string) => methodKey,
    });

    for (const path of Object.values(doc.paths ?? {})) {
      for (const operation of Object.values(path ?? {})) {
        const op = operation as OperationObject;
        if (op?.operationId && !op.summary) {
          op.summary = op.operationId
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/^\w/, (c: string) => c.toUpperCase());
        }
      }
    }

    return doc;
  };

  app.use(
    '/docs',
    apiReference({
      content: document,
      theme: 'deepSpace',
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
