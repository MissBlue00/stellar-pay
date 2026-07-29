import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    let client: Redis | null = null;

    try {
      client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: 1,
        retryStrategy: null,
        lazyConnect: true,
      });

      await client.connect();
      const response = await client.ping();

      if (response !== 'PONG') {
        throw new Error(`Unexpected Redis ping response: ${response}`);
      }

      return this.getStatus(key, true);
    } catch (error) {
      this.logger.error(`Redis health check failed: ${(error as Error).message}`);
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { message: 'Redis connection unavailable' }),
      );
    } finally {
      if (client) {
        client.disconnect();
      }
    }
  }
}
