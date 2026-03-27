import Redis, { RedisOptions } from 'ioredis';

// --- Redis Client Configuration ---
const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_PREFIX || 'stellar-pay:',
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
    },
};

// Use REDIS_URL if provided, else fallback to individual options
export const redisClient = new Redis(process.env.REDIS_URL || redisOptions);

redisClient.on('connect', () => {
    console.log('[Redis] Connected gracefully');
});

redisClient.on('error', (err) => {
    console.error('[Redis] Error connecting: ', err);
});

// --- Cache Decorators ---

/**
 * Cacheable Decorator for expensive operations
 * @param keyPrefix Prefix for the cache key
 * @param ttl Time to live in seconds (default 300)
 */
export function Cacheable(keyPrefix: string, ttl: number = 300) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const key = `${keyPrefix}:${args.join(':')}`;

            try {
                const cachedValue = await redisClient.get(key);

                if (cachedValue) {
                    console.log(`[Cache Hit] key: ${key}`);
                    return JSON.parse(cachedValue);
                }

                console.log(`[Cache Miss] key: ${key}`);
                const result = await originalMethod.apply(this, args);

                if (result !== undefined && result !== null) {
                    await redisClient.set(key, JSON.stringify(result), 'EX', ttl);
                }

                return result;
            } catch (error) {
                console.error(`[Cache Error] failed to process key: ${key}`, error);
                return await originalMethod.apply(this, args);
            }
        };

        return descriptor;
    };
}

/**
 * CacheInvalidate Decorator for clearing cache after updates
 * @param keyPrefix Prefix for the cache key to invalidate
 */
export function CacheInvalidate(keyPrefix: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // Assuming the first argument is the identifier (like transactionId)
            const id = args[0];
            const key = id ? `${keyPrefix}:${id}` : keyPrefix;

            const result = await originalMethod.apply(this, args);

            try {
                await redisClient.del(key);
                console.log(`[Cache Invalidation] cleared key: ${key}`);
            } catch (error) {
                console.error(`[Cache Error] failed to invalidate key: ${key}`, error);
            }

            return result;
        };

        return descriptor;
    };
}

// --- Specific Transaction Cache Class implementation ---

export class TransactionStatusCache {
    private static PREFIX = 'tx_status';
    private static TTL = 60;

    static async getStatus(transactionId: string): Promise<string | null> {
        const key = `${this.PREFIX}:${transactionId}`;
        try {
            const value = await redisClient.get(key);
            if (value) {
                console.log(`[Cache Hit] Transaction Status Lookup - key: ${key}`);
                return value;
            }
            console.log(`[Cache Miss] Transaction Status Lookup - key: ${key}`);
            return null;
        } catch (err) {
            console.error(`[Cache Error] getStatus: ${key}`, err);
            return null;
        }
    }

    static async setStatus(transactionId: string, status: string): Promise<void> {
        const key = `${this.PREFIX}:${transactionId}`;
        try {
            await redisClient.set(key, status, 'EX', this.TTL);
            console.log(`[Cache Set] Transaction Status stored - key: ${key}`);
        } catch (err) {
            console.error(`[Cache Error] setStatus: ${key}`, err);
        }
    }

    static async invalidateStatus(transactionId: string): Promise<void> {
        const key = `${this.PREFIX}:${transactionId}`;
        try {
            await redisClient.del(key);
            console.log(`[Cache Invalidation] Transaction Status cleared - key: ${key}`);
        } catch (err) {
            console.error(`[Cache Error] invalidateStatus: ${key}`, err);
        }
    }
}
