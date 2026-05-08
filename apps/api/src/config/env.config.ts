import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  TREASURY_PRIVATE_KEY: z.string().min(1, 'TREASURY_PRIVATE_KEY is required'),
  STELLAR_RPC_URL: z.string().url('STELLAR_RPC_URL must be a valid URL'),
  BTC_NODE_URL: z.string().url('BTC_NODE_URL must be a valid URL'),
  ETH_NODE_URL: z.string().url('ETH_NODE_URL must be a valid URL'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const formatted = Object.entries(errors)
      .map(([key, messages]) => `  - ${key}: ${messages?.join(', ')}`)
      .join('\n');

    throw new Error(
      `Environment variable validation failed:\n${formatted}\n\nPlease check your .env file and ensure all required variables are set correctly.`,
    );
  }

  return result.data;
}
