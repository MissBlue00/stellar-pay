import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { TreasuryService } from '../../treasury/treasury.service';

@Injectable()
export class TreasuryWalletHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(TreasuryWalletHealthIndicator.name);
  private readonly assetCode = process.env.TREASURY_ASSET_CODE ?? 'USDC';
  private readonly treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
  private readonly minimumBalance = Number.isFinite(
    parseFloat(process.env.TREASURY_HEALTH_MIN_BALANCE ?? '0'),
  )
    ? parseFloat(process.env.TREASURY_HEALTH_MIN_BALANCE ?? '0')
    : 0;

  constructor(private readonly treasuryService: TreasuryService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this.treasuryAddress) {
      throw new HealthCheckError(
        'Treasury wallet check failed',
        this.getStatus(key, false, { message: 'Missing TREASURY_WALLET_ADDRESS' }),
      );
    }

    try {
      const balance = await this.treasuryService.getTreasuryBalance(
        this.assetCode,
        this.treasuryAddress,
      );

      const currentBalance = parseFloat(balance);
      if (Number.isNaN(currentBalance)) {
        throw new Error(`Invalid treasury balance received: ${balance}`);
      }

      this.logger.log(
        `Treasury wallet balance for ${this.assetCode} at ${this.treasuryAddress}: ${balance}`,
      );

      const isHealthy = currentBalance > this.minimumBalance;
      const status = this.getStatus(key, isHealthy, {
        assetCode: this.assetCode,
        treasuryAddress: this.treasuryAddress,
        currentBalance: balance,
        minimumBalance: this.minimumBalance.toString(),
      });

      if (!isHealthy) {
        throw new HealthCheckError('Treasury wallet balance below minimum threshold', status);
      }

      return status;
    } catch (error) {
      this.logger.error('Treasury wallet health check failed', error as Error);
      throw new HealthCheckError(
        'Treasury wallet check failed',
        this.getStatus(key, false, {
          message: (error as Error).message ?? 'Treasury wallet unavailable',
        }),
      );
    }
  }
}
