import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { apiLogger } from './logger';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<
      Request & { correlationId?: string; user?: { sub?: string } }
    >();
    const response = http.getResponse<{ statusCode?: number }>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          apiLogger.info('HTTP request completed', {
            event: 'http_request_completed',
            method: request.method,
            route: request.originalUrl,
            statusCode: response.statusCode,
            durationMs: Date.now() - start,
            correlationId: request.correlationId,
            userId: request.user?.sub,
          });
        },
        error: (error: unknown) => {
          apiLogger.error('HTTP request failed', {
            event: 'http_request_failed',
            method: request.method,
            route: request.originalUrl,
            statusCode: response.statusCode,
            durationMs: Date.now() - start,
            correlationId: request.correlationId,
            userId: request.user?.sub,
            error,
          });
        },
      }),
    );
  }
}
