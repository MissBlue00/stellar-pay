import { Injectable, Logger } from '@nestjs/common';
import { AssetReserve } from './interfaces/proof-of-reserves.interface';
import { TreasuryBalanceStore } from './treasury-balance.store';
import {
  TreasuryBalance,
  TreasuryBalanceOperationResult,
} from './interfaces/treasury-balance.interface';

@Injectable()
export class TreasuryService {
  private readonly logger = new Logger(TreasuryService.name);

  constructor(private readonly balanceStore: TreasuryBalanceStore) {}

  /**
   * Mints a Specified amount of an asset in the treasury.
   * Atomically updates the internal ledger and logs the operation.
   */
  async mintAsset(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
    mintCap?: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    this.logger.log(`Initiating mint: ${amount} ${assetCode} (Issuer: ${assetIssuer})`);

    try {
      const result = await this.balanceStore.mint(assetCode, assetIssuer, amount, mintCap);

      this.logger.log(
        `Mint successful: ${amount} ${assetCode}. ` +
          `New available: ${result.available_balance}, reserved: ${result.reserved_balance}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Mint failed for ${assetCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Burns a specified amount of an asset from the treasury.
   * Atomically updates the internal ledger and logs the operation.
   */
  async burnAsset(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    this.logger.log(`Initiating burn: ${amount} ${assetCode} (Issuer: ${assetIssuer})`);

    try {
      const result = await this.balanceStore.burn(assetCode, assetIssuer, amount);

      this.logger.log(
        `Burn successful: ${amount} ${assetCode}. ` +
          `New available: ${result.available_balance}, reserved: ${result.reserved_balance}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Burn failed for ${assetCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reserves a specified amount of an asset.
   * Moves funds from available_balance to reserved_balance atomically.
   */
  async reserveFunds(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    this.logger.log(`Reserving funds: ${amount} ${assetCode}`);

    try {
      return await this.balanceStore.reserve(assetCode, assetIssuer, amount);
    } catch (error) {
      this.logger.error(`Reserve failed for ${assetCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Releases a specified amount of an asset from reservation.
   * Moves funds from reserved_balance back to available_balance atomically.
   */
  async releaseFunds(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    this.logger.log(`Releasing funds: ${amount} ${assetCode}`);

    try {
      return await this.balanceStore.release(assetCode, assetIssuer, amount);
    } catch (error) {
      this.logger.error(`Release failed for ${assetCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Settles a specified amount of an asset from reservation.
   * Decrements reserved_balance without returning to available_balance.
   */
  async settleFunds(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    this.logger.log(`Settling funds: ${amount} ${assetCode}`);

    try {
      return await this.balanceStore.settle(assetCode, assetIssuer, amount);
    } catch (error) {
      this.logger.error(`Settle failed for ${assetCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves the internal ledger balance for a specific asset.
   */
  getInternalBalance(assetCode: string, assetIssuer: string): TreasuryBalance {
    return this.balanceStore.getBalance(assetCode, assetIssuer);
  }

  /**
   * Retrieves the total tracked balance (available + reserved) for a specific asset.
   */
  getTotalTrackedBalance(assetCode: string, assetIssuer: string): bigint {
    return this.balanceStore.getTotalTracked(assetCode, assetIssuer);
  }

  async getTotalSupply(_assetCode: string): Promise<string> {
    // TODO: Implement actual on-chain supply query using @stellar/stellar-sdk
    return '0';
  }

  async getTreasuryBalance(assetCode: string, assetIssuer: string): Promise<string> {
    try {
      const balance = this.balanceStore.getTotalTracked(assetCode, assetIssuer);
      return balance.toString();
    } catch {
      return '0';
    }
  }

  calculateReserveRatio(treasuryBalance: string, totalSupply: string): number {
    const treasury = parseFloat(treasuryBalance);
    const supply = parseFloat(totalSupply);

    if (supply === 0) return 0;

    return Math.round((treasury / supply) * 10000) / 100; // Return as percentage with 2 decimals
  }

  async getAssetReserve(assetCode: string): Promise<AssetReserve> {
    const treasuryIssuer = process.env.TREASURY_ISSUER_ADDRESS ?? 'GDTREASURYADDRESSXXXXXX';

    const [totalSupply, treasuryBalance] = await Promise.all([
      this.getTotalSupply(assetCode),
      this.getTreasuryBalance(assetCode, treasuryIssuer),
    ]);

    const reserveRatio = this.calculateReserveRatio(treasuryBalance, totalSupply);

    return {
      symbol: assetCode,
      total_supply: totalSupply,
      treasury_balance: treasuryBalance,
      reserve_ratio: reserveRatio,
    };
  }
}
