import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { apiLogger, LoggingExceptionFilter, RequestLoggingInterceptor } from './observability';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalFilters(new LoggingExceptionFilter());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  apiLogger.info('API bootstrap completed', {
    event: 'api_bootstrap_completed',
    port,
  });
}
bootstrap();
