import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const CSRF_COOKIE_NAME = 'csrf_secret';
export const CSRF_TOKEN_HEADER = 'x-csrf-token';
export const CSRF_TOKEN_FIELD = 'csrf_token';

const PUBLIC_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh']);
const CSRF_SECRET_LENGTH = 32;
const CSRF_TOKEN_PAYLOAD = 'csrf-token';

export function generateCsrfSecret(): string {
  return randomBytes(CSRF_SECRET_LENGTH).toString('base64url');
}

export function generateCsrfToken(secret: string): string {
  return createHmac('sha256', secret).update(CSRF_TOKEN_PAYLOAD).digest('base64url');
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    if (PUBLIC_PATHS.has(req.path)) {
      return next();
    }

    const secret = req.cookies?.[CSRF_COOKIE_NAME];
    const token =
      (req.headers[CSRF_TOKEN_HEADER] as string | undefined) ||
      req.body?.[CSRF_TOKEN_FIELD] ||
      req.body?._csrf ||
      req.query?.[CSRF_TOKEN_FIELD];

    if (!secret || !token) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    const expectedToken = generateCsrfToken(secret);
    const expectedBuffer = Buffer.from(expectedToken, 'utf8');
    const tokenBuffer = Buffer.from(token, 'utf8');

    if (expectedBuffer.length !== tokenBuffer.length) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    if (!timingSafeEqual(expectedBuffer, tokenBuffer)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return next();
  }
}
