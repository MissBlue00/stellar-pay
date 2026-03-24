import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { BlockchainRpcHealthIndicator } from './indicators/blockchain-rpc.health';
import { TreasuryWalletHealthIndicator } from './indicators/treasury-wallet.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly blockchainRpc: BlockchainRpcHealthIndicator,
    private readonly treasury: TreasuryWalletHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.database.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () => this.blockchainRpc.isHealthy('blockchain_rpc'),
      () => this.treasury.isHealthy('treasury_wallet'),
    ]);
  }
}
