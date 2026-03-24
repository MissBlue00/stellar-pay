import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { createCorrelationId, runWithRequestContext } from './request-context';

declare module 'express-serve-static-core' {
  interface Request {
    correlationId?: string;
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const correlationId = createCorrelationId(
      readHeaderValue(request.headers['x-correlation-id']) ??
        readHeaderValue(request.headers['x-request-id']),
    );

    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    runWithRequestContext(
      {
        correlationId,
        method: request.method,
        route: request.originalUrl,
      },
      next,
    );
  }
}

function readHeaderValue(header: string | string[] | undefined): string | undefined {
  if (Array.isArray(header)) {
    return header[0];
  }

  return header;
}
