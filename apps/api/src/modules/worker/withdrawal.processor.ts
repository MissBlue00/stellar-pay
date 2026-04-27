import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StellarService } from '@stellar-pay/payments-engine';
import { RedemptionRepository } from '../database/redemption.repository';

@Injectable()
export class WithdrawalProcessor {
  private readonly logger = new Logger(WithdrawalProcessor.name);
  private readonly stellarService: StellarService;

  constructor(private readonly redemptionRepo: RedemptionRepository) {
    // Instantiate the engine service
    this.stellarService = new StellarService();
  }

  // Polls the database every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingRedemptions() {
    this.logger.log('Scanning for pending redemptions...');

    // 1. Scan Redemption table for pending status
    const pendingRedemptions = await this.redemptionRepo.getPending(50);

    if (pendingRedemptions.length === 0) {
      this.logger.debug('No pending redemptions found.');
      return;
    }

    for (const redemption of pendingRedemptions) {
      try {
        this.logger.log(
          `Processing redemption ${redemption.id} for amount ${redemption.amount} XLM`,
        );

        // 2. Execute blockchain transfer
        const txHash = await this.stellarService.sendFunds(
          redemption.destinationAddress,
          redemption.amount,
        );

        // 3. Update status to completed and store TX hash
        await this.redemptionRepo.markCompleted(redemption.id, txHash);

        this.logger.log(`Successfully processed redemption ${redemption.id}. TX: ${txHash}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to process redemption ${redemption.id}: ${errorMessage}`);

        await this.redemptionRepo.markFailed(redemption.id, errorMessage);
      }
    }
  }
}
