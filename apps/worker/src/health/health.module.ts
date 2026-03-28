import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { BlockchainRpcHealthIndicator } from './indicators/blockchain-rpc.health';
import { TreasuryWalletHealthIndicator } from './indicators/treasury-wallet.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    BlockchainRpcHealthIndicator,
    TreasuryWalletHealthIndicator,
  ],
})
export class HealthModule {}
