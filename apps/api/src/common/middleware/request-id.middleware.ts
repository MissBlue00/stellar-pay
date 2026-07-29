import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

import 'express';

declare module 'express' {
  interface Request {
    requestId?: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = this.getRequestId(req);

    req.requestId = requestId;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
  }

  private getRequestId(req: Request): string {
    const headerId = req.get?.('x-request-id') || req.headers?.['x-request-id'];

    if (typeof headerId === 'string' && headerId.trim()) {
      return headerId;
    }

    return randomUUID();
  }
}
