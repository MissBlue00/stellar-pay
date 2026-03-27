import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class ThrottlerRedisGuard extends ThrottlerGuard {
  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Rate limit exceeded');
  }

  protected async getTracker(req: Request): Promise<string> {
    const user = req.user as { merchant_id?: string } | undefined;
    if (user?.merchant_id) {
      return `merchant:${user.merchant_id}`;
    }
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return req.ip ?? ip ?? 'unknown';
  }
}
