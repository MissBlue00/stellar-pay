import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();
    const requestId = this.getRequestId(req);
    let hasLogged = false;

    const logOnce = () => {
      if (hasLogged) {
        return;
      }

      hasLogged = true;
      this.logResponse(req, res, startedAt, requestId);
    };

    res.once('finish', logOnce);
    res.once('close', logOnce);

    next();
  }

  private getRequestId(req: Request): string {
    const headerId = req.get?.('x-request-id') || req.headers?.['x-request-id'];
    if (typeof headerId === 'string' && headerId.trim()) {
      return headerId;
    }

    return 'unknown';
  }

  private logResponse(req: Request, res: Response, startedAt: number, requestId: string) {
    const durationMs = Date.now() - startedAt;
    const statusCode = res.statusCode ?? 500;
    const message = JSON.stringify({
      event: 'http_request',
      method: req.method,
      path: req.originalUrl || req.url || req.path,
      statusCode,
      durationMs,
      requestId,
    });

    if (statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }
}
