import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;

  private async getClient() {
    if (this.client) return this.client;

    // TODO: Inject Redis client when Redis service is implemented
    // Example:
    // if (!this.client) {
    //   this.client = await createClient(process.env.REDIS_URL).connect();
    // }

    return null;
  }

  async increment(
    _key: string,
    ttl: number,
    _limit: number,
    _blockDuration: number,
    _throttlerName: string,
  ) {
    const client = await this.getClient();

    if (!client) {
      return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
    }

    // TODO: Implement Redis storage
    // Example:
    // const redisKey = `throttler:${throttlerName}:${key}`;
    // const multi = client.multi();
    // multi.incr(redisKey);
    // multi.ttl(redisKey);
    // const [totalHits, timeToExpire] = await multi.exec();
    //
    // if (totalHits === 1) {
    //   await client.expire(redisKey, Math.ceil(ttl / 1000));
    // }
    //
    // const isBlocked = totalHits > limit;
    // return {
    //   totalHits,
    //   timeToExpire: timeToExpire >= 0 ? timeToExpire * 1000 : ttl,
    //   isBlocked,
    //   timeToBlockExpire: isBlocked ? blockDuration : 0,
    // };

    return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
  }
}
