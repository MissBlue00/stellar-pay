import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { apiLogger } from './logger';

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request & { correlationId?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: 'Internal server error',
          };

    apiLogger.error('Unhandled exception', {
      event: 'unhandled_exception',
      method: request.method,
      route: request.originalUrl,
      statusCode: status,
      correlationId: request.correlationId,
      error: exception,
    });

    response.status(status).json({
      ...(typeof payload === 'string' ? { message: payload } : payload),
      correlationId: request.correlationId,
    });
  }
}
