import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage {
  private readonly logger = new Logger(ThrottlerStorageRedisService.name);
  private client: Redis | null = null;

  private async getClient(): Promise<Redis | null> {
    if (this.client) return this.client;

    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error(`Failed to connect to Redis: ${(err as Error).message}`);
      this.client = null;
      return null;
    }

    return this.client;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ) {
    const client = await this.getClient();

    if (!client) {
      return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
    }

    const redisKey = `throttler:${throttlerName}:${key}`;
    const multi = client.multi();
    multi.incr(redisKey);
    multi.ttl(redisKey);
    const results = await multi.exec();

    if (!results) {
      return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
    }

    const totalHits = results[0][1] as number;
    let timeToExpire = results[1][1] as number;

    if (totalHits === 1) {
      await client.expire(redisKey, Math.ceil(ttl / 1000));
      timeToExpire = Math.ceil(ttl / 1000);
    }

    timeToExpire = timeToExpire >= 0 ? timeToExpire * 1000 : ttl;

    const isBlocked = totalHits > limit;
    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: isBlocked ? blockDuration : 0,
    };
  }
}
