import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { apiLogger, LoggingExceptionFilter, RequestLoggingInterceptor } from './observability';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalFilters(new LoggingExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Stellar Pay API Documentation')
    .setDescription('The API description for stellar pay')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'ApiKey-auth')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  apiLogger.info('API bootstrap completed', {
    event: 'api_bootstrap_completed',
    port,
  });
}
bootstrap();
