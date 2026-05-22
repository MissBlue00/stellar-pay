import { registerAs } from '@nestjs/config';
import type { EnvConfig } from './env.validation';

export const appConfig = registerAs('app', () => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET as string,
}));

export const stellarConfig = registerAs('stellar', () => ({
  rpcUrl: process.env.STELLAR_RPC_URL as string,
  network: (process.env.STELLAR_NETWORK as string) ?? 'TESTNET',
  treasuryPrivateKey: process.env.TREASURY_PRIVATE_KEY as string,
  treasuryWalletAddress: process.env
    .TREASURY_WALLET_ADDRESS as string,
  supportedAssets: (
    process.env.SUPPORTED_ASSETS ?? 'USDC,ARS'
  ).split(','),
}));

export const blockchainConfig = registerAs('blockchain', () => ({
  btcNodeUrl: process.env.BTC_NODE_URL as string,
  ethNodeUrl: process.env.ETH_NODE_URL as string,
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL as string,
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL as string,
}));

export const allConfigs = [
  appConfig,
  jwtConfig,
  stellarConfig,
  blockchainConfig,
  databaseConfig,
  redisConfig,
];

export type AppConfiguration = EnvConfig;
