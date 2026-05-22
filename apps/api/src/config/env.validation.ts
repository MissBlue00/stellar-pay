import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      { message: 'DATABASE_URL must be a valid PostgreSQL connection string' },
    ),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  TREASURY_PRIVATE_KEY: z
    .string()
    .min(1, 'TREASURY_PRIVATE_KEY is required')
    .regex(
      /^S[A-Z0-9]{55}$/,
      'TREASURY_PRIVATE_KEY must be a valid Stellar secret key starting with S',
    ),

  STELLAR_RPC_URL: z.string().url('STELLAR_RPC_URL must be a valid URL'),

  BTC_NODE_URL: z.string().url('BTC_NODE_URL must be a valid URL'),

  ETH_NODE_URL: z.string().url('ETH_NODE_URL must be a valid URL'),

  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  STELLAR_NETWORK: z.enum(['TESTNET', 'PUBLIC']).default('TESTNET'),

  SUPPORTED_ASSETS: z.string().default('USDC,ARS'),

  TREASURY_WALLET_ADDRESS: z
    .string()
    .min(1, 'TREASURY_WALLET_ADDRESS is required')
    .regex(
      /^G[A-Z0-9]{55}$/,
      'TREASURY_WALLET_ADDRESS must be a valid Stellar public key starting with G',
    ),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Environment validation failed:\n${errors}\n\n` +
        'The application cannot start without valid configuration. ' +
        'Please check your .env file and ensure all required variables are set correctly.',
    );
  }

  return result.data;
}
