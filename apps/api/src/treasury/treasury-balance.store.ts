import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  TreasuryBalance,
  TreasuryBalanceOperationResult,
} from './interfaces/treasury-balance.interface';
import {
  BalanceNotFoundError,
  InsufficientAvailableBalanceError,
  InsufficientReservedBalanceError,
  MintLimitExceededError,
  AtomicUpdateFailedError,
} from './errors/treasury-balance.errors';
import { assertTreasuryInvariants } from './treasury-balance.invariants';

/**
 * TreasuryBalanceStore — Atomic in-memory ledger for treasury balances.
 *
 * This store manages TreasuryBalance records and ensures atomicity for all
 * mutation operations using a simple promise-based mutex. While the store is
 * currently in-memory, the interface and atomicity guarantees are designed
 * to be consistent with future database-backed implementations.
 */
@Injectable()
export class TreasuryBalanceStore {
  private readonly logger = new Logger(TreasuryBalanceStore.name);
  private readonly balances = new Map<string, TreasuryBalance>();

  /**
   * Simple async mutex to serialise all write operations.
   * Ensures that only one mutation happens at a time across all assets,
   * preventing race conditions in the in-memory state.
   */
  private mutex = Promise.resolve();

  /**
   * Executes a mutation operation within the mutex-protected critical section.
   * Use this for all operations that modify balance state.
   */
  private async withMutex<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.mutex = this.mutex
        .then(async () => {
          try {
            const result = await operation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .catch((error) => {
          // Keep the mutex chain alive even if an operation fails
          this.logger.error(`Mutex-protected operation failed: ${error.message}`);
          reject(error);
        });
    });
  }

  /**
   * Generates a unique key for an asset in the store.
   */
  private getAssetKey(assetCode: string, assetIssuer: string): string {
    return `${assetCode.toUpperCase()}:${assetIssuer}`;
  }

  /**
   * Retrieves a record or creates a default one if it doesn't exist.
   * Internal helper for mutation operations.
   */
  private getOrCreateBalance(assetCode: string, assetIssuer: string): TreasuryBalance {
    const key = this.getAssetKey(assetCode, assetIssuer);
    const existing = this.balances.get(key);

    if (existing) {
      return { ...existing }; // Return a clone for mutation
    }

    const now = new Date();
    return {
      id: randomUUID(),
      asset_code: assetCode,
      asset_issuer: assetIssuer,
      available_balance: 0n,
      reserved_balance: 0n,
      total_minted: 0n,
      total_burned: 0n,
      last_updated_at: now,
      created_at: now,
    };
  }

  /**
   * Atomic Mint Operation
   * Increments available_balance and total_minted.
   */
  async mint(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
    mintCap?: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    if (amount <= 0n) throw new AtomicUpdateFailedError('Mint amount must be positive');

    return this.withMutex(async () => {
      const balance = this.getOrCreateBalance(assetCode, assetIssuer);
      const originalTotal = balance.available_balance + balance.reserved_balance;

      // Validate cap if provided
      if (mintCap !== undefined && balance.total_minted + amount > mintCap) {
        throw new MintLimitExceededError(amount, balance.total_minted, mintCap);
      }

      // Apply mutations
      balance.available_balance += amount;
      balance.total_minted += amount;
      balance.last_updated_at = new Date();

      // Verify invariants
      assertTreasuryInvariants(balance, originalTotal + amount);

      // Commit
      this.balances.set(this.getAssetKey(assetCode, assetIssuer), balance);

      return {
        operation: 'mint',
        asset_code: assetCode,
        amount,
        available_balance: balance.available_balance,
        reserved_balance: balance.reserved_balance,
        success: true,
      };
    });
  }

  /**
   * Atomic Burn Operation
   * Decrements available_balance and increments total_burned.
   */
  async burn(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    if (amount <= 0n) throw new AtomicUpdateFailedError('Burn amount must be positive');

    return this.withMutex(async () => {
      const balance = this.balances.get(this.getAssetKey(assetCode, assetIssuer));
      if (!balance) throw new BalanceNotFoundError(assetCode, assetIssuer);

      if (balance.available_balance < amount) {
        throw new InsufficientAvailableBalanceError(amount, balance.available_balance);
      }

      const updated = { ...balance };
      const originalTotal = updated.available_balance + updated.reserved_balance;

      // Apply mutations
      updated.available_balance -= amount;
      updated.total_burned += amount;
      updated.last_updated_at = new Date();

      // Verify invariants
      assertTreasuryInvariants(updated, originalTotal - amount);

      // Commit
      this.balances.set(this.getAssetKey(assetCode, assetIssuer), updated);

      return {
        operation: 'burn',
        asset_code: assetCode,
        amount,
        available_balance: updated.available_balance,
        reserved_balance: updated.reserved_balance,
        success: true,
      };
    });
  }

  /**
   * Atomic Reserve Operation
   * Moves funds from available_balance to reserved_balance.
   */
  async reserve(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    if (amount <= 0n) throw new AtomicUpdateFailedError('Reserve amount must be positive');

    return this.withMutex(async () => {
      const balance = this.balances.get(this.getAssetKey(assetCode, assetIssuer));
      if (!balance) throw new BalanceNotFoundError(assetCode, assetIssuer);

      if (balance.available_balance < amount) {
        throw new InsufficientAvailableBalanceError(amount, balance.available_balance);
      }

      const updated = { ...balance };
      const totalBefore = updated.available_balance + updated.reserved_balance;

      // Apply mutations
      updated.available_balance -= amount;
      updated.reserved_balance += amount;
      updated.last_updated_at = new Date();

      // Verify invariants (total must remain the same)
      assertTreasuryInvariants(updated, totalBefore);

      // Commit
      this.balances.set(this.getAssetKey(assetCode, assetIssuer), updated);

      return {
        operation: 'reserve',
        asset_code: assetCode,
        amount,
        available_balance: updated.available_balance,
        reserved_balance: updated.reserved_balance,
        success: true,
      };
    });
  }

  /**
   * Atomic Release Operation
   * Moves funds from reserved_balance back to available_balance.
   */
  async release(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    if (amount <= 0n) throw new AtomicUpdateFailedError('Release amount must be positive');

    return this.withMutex(async () => {
      const balance = this.balances.get(this.getAssetKey(assetCode, assetIssuer));
      if (!balance) throw new BalanceNotFoundError(assetCode, assetIssuer);

      if (balance.reserved_balance < amount) {
        throw new InsufficientReservedBalanceError(amount, balance.reserved_balance);
      }

      const updated = { ...balance };
      const totalBefore = updated.available_balance + updated.reserved_balance;

      // Apply mutations
      updated.reserved_balance -= amount;
      updated.available_balance += amount;
      updated.last_updated_at = new Date();

      // Verify invariants (total must remain the same)
      assertTreasuryInvariants(updated, totalBefore);

      // Commit
      this.balances.set(this.getAssetKey(assetCode, assetIssuer), updated);

      return {
        operation: 'release',
        asset_code: assetCode,
        amount,
        available_balance: updated.available_balance,
        reserved_balance: updated.reserved_balance,
        success: true,
      };
    });
  }

  /**
   * Atomic Settle Operation
   * Decrements reserved_balance without returning to available_balance.
   */
  async settle(
    assetCode: string,
    assetIssuer: string,
    amount: bigint,
  ): Promise<TreasuryBalanceOperationResult> {
    if (amount <= 0n) throw new AtomicUpdateFailedError('Settle amount must be positive');

    return this.withMutex(async () => {
      const balance = this.balances.get(this.getAssetKey(assetCode, assetIssuer));
      if (!balance) throw new BalanceNotFoundError(assetCode, assetIssuer);

      if (balance.reserved_balance < amount) {
        throw new InsufficientReservedBalanceError(amount, balance.reserved_balance);
      }

      const updated = { ...balance };
      const totalBefore = updated.available_balance + updated.reserved_balance;

      // Apply mutations
      updated.reserved_balance -= amount;
      updated.last_updated_at = new Date();

      // Verify invariants
      assertTreasuryInvariants(updated, totalBefore - amount);

      // Commit
      this.balances.set(this.getAssetKey(assetCode, assetIssuer), updated);

      return {
        operation: 'settle',
        asset_code: assetCode,
        amount,
        available_balance: updated.available_balance,
        reserved_balance: updated.reserved_balance,
        success: true,
      };
    });
  }

  /**
   * Retrieves the full TreasuryBalance record for a specific asset.
   */
  getBalance(assetCode: string, assetIssuer: string): TreasuryBalance {
    const balance = this.balances.get(this.getAssetKey(assetCode, assetIssuer));
    if (!balance) throw new BalanceNotFoundError(assetCode, assetIssuer);
    return { ...balance };
  }

  /**
   * Returns available_balance + reserved_balance for quick consistency checks.
   */
  getTotalTracked(assetCode: string, assetIssuer: string): bigint {
    const balance = this.balances.get(this.getAssetKey(assetCode, assetIssuer));
    if (!balance) return 0n;
    return balance.available_balance + balance.reserved_balance;
  }
}
