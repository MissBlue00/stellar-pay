import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(
    compression({
      threshold: 1024,
      filter: (req: Request, res: Response) => {
        if (req.path.startsWith('/health')) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );
  const csrfMiddleware = new CsrfMiddleware();
  app.use(csrfMiddleware.use.bind(csrfMiddleware));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Stellar Pay API Documentation')
    .setDescription('The API description for stellar pay')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'ApiKey-auth')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
