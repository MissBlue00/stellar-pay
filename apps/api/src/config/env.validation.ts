import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  TREASURY_PRIVATE_KEY: z.string().startsWith('S').length(56, 'TREASURY_PRIVATE_KEY must be a valid Stellar secret key (56 characters)'),
  STELLAR_RPC_URL: z.string().url('STELLAR_RPC_URL must be a valid URL'),
  BTC_NODE_URL: z.string().url('BTC_NODE_URL must be a valid URL'),
  ETH_NODE_URL: z.string().url('ETH_NODE_URL must be a valid URL'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
  PORT: z.coerce.number().default(3000),
});

export function validate(config: Record<string, unknown>) {
  const validatedConfig = envSchema.safeParse(config);

  if (!validatedConfig.success) {
    console.error('❌ Environment validation failed:', JSON.stringify(validatedConfig.error.format(), null, 2));
    process.exit(1);
  }

  return validatedConfig.data;
}
