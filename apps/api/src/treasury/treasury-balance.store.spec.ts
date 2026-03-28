import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { TreasuryBalanceStore } from './treasury-balance.store';
import {
  BalanceNotFoundError,
  InsufficientAvailableBalanceError,
  InsufficientReservedBalanceError,
  MintLimitExceededError,
} from './errors/treasury-balance.errors';

describe('TreasuryBalanceStore', () => {
  let store: TreasuryBalanceStore;
  const assetCode = 'USDC';
  const assetIssuer = 'GDTREASURYADDRESSXXXXXX';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TreasuryBalanceStore],
    }).compile();

    store = module.get<TreasuryBalanceStore>(TreasuryBalanceStore);
  });

  describe('TreasuryBalance Structure', () => {
    it('should create a record with valid fields on first mint', async () => {
      const amount = 1000n;
      const result = await store.mint(assetCode, assetIssuer, amount);

      expect(result.success).toBe(true);
      expect(result.available_balance).toBe(amount);
      expect(result.reserved_balance).toBe(0n);

      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.asset_code).toBe(assetCode);
      expect(record.asset_issuer).toBe(assetIssuer);
      expect(record.total_minted).toBe(amount);
      expect(record.total_burned).toBe(0n);
      expect(record.created_at).toBeInstanceOf(Date);
      expect(record.last_updated_at).toBeInstanceOf(Date);
    });

    it('should throw BalanceNotFoundError when retrieving non-existent record', () => {
      expect(() => store.getBalance('NONEXISTENT', assetIssuer)).toThrow(BalanceNotFoundError);
    });

    it('should return 0 for getTotalTracked when no record exists', () => {
      expect(store.getTotalTracked('NONEXISTENT', assetIssuer)).toBe(0n);
    });
  });

  describe('Atomic Mint Operation', () => {
    it('should successfuly mint and increment balances', async () => {
      await store.mint(assetCode, assetIssuer, 100n);
      const result = await store.mint(assetCode, assetIssuer, 50n);

      expect(result.available_balance).toBe(150n);
      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.total_minted).toBe(150n);
    });

    it('should reject mint if it exceeds cap', async () => {
      await store.mint(assetCode, assetIssuer, 500n);
      await expect(store.mint(assetCode, assetIssuer, 501n, 1000n)).rejects.toThrow(
        MintLimitExceededError,
      );

      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.available_balance).toBe(500n); // Unchanged
    });

    it('should produce consistent state with concurrent mints', async () => {
      // Execute 50 concurrent mints of 1 unit each
      const mints = Array.from({ length: 50 }, () => store.mint(assetCode, assetIssuer, 1n));
      await Promise.all(mints);

      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.available_balance).toBe(50n);
      expect(record.total_minted).toBe(50n);
    });
  });

  describe('Atomic Burn Operation', () => {
    beforeEach(async () => {
      await store.mint(assetCode, assetIssuer, 1000n);
    });

    it('should successfully burn and decrement balances', async () => {
      const result = await store.burn(assetCode, assetIssuer, 400n);
      expect(result.available_balance).toBe(600n);

      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.total_burned).toBe(400n);
    });

    it('should throw error when burning more than available', async () => {
      await expect(store.burn(assetCode, assetIssuer, 1001n)).rejects.toThrow(
        InsufficientAvailableBalanceError,
      );
    });

    it('should produce consistent state with concurrent burns', async () => {
      const burns = Array.from({ length: 10 }, () => store.burn(assetCode, assetIssuer, 50n));
      await Promise.all(burns);

      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.available_balance).toBe(500n);
      expect(record.total_burned).toBe(500n);
    });

    it('should prevent combined burns from exceeding available balance during concurrency', async () => {
      // 1000 available. Try to burn 1100 concurrently (11 x 100)
      const burns = Array.from({ length: 11 }, () =>
        store.burn(assetCode, assetIssuer, 100n).catch((e) => e),
      );
      const results = await Promise.all(burns);

      const successes = results.filter((r) => r.success === true).length;
      const failures = results.filter((r) => r instanceof InsufficientAvailableBalanceError).length;

      expect(successes).toBe(10);
      expect(failures).toBe(1);

      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.available_balance).toBe(0n);
    });
  });

  describe('Reserve, Release, Settle', () => {
    beforeEach(async () => {
      await store.mint(assetCode, assetIssuer, 1000n);
    });

    it('should move funds from available to reserved atomically', async () => {
      const result = await store.reserve(assetCode, assetIssuer, 300n);
      expect(result.available_balance).toBe(700n);
      expect(result.reserved_balance).toBe(300n);

      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.available_balance).toBe(700n);
      expect(record.reserved_balance).toBe(300n);
    });

    it('should throw error if insufficient available for reserve', async () => {
      await expect(store.reserve(assetCode, assetIssuer, 1001n)).rejects.toThrow(
        InsufficientAvailableBalanceError,
      );
    });

    it('should move funds from reserved to available atomically', async () => {
      await store.reserve(assetCode, assetIssuer, 500n);
      const result = await store.release(assetCode, assetIssuer, 200n);

      expect(result.available_balance).toBe(700n);
      expect(result.reserved_balance).toBe(300n);
    });

    it('should throw error if insufficient reserved for release', async () => {
      await expect(store.release(assetCode, assetIssuer, 1n)).rejects.toThrow(
        InsufficientReservedBalanceError,
      );
    });

    it('should decrement reserved_balance on settle', async () => {
      await store.reserve(assetCode, assetIssuer, 500n);
      const result = await store.settle(assetCode, assetIssuer, 200n);

      expect(result.available_balance).toBe(500n);
      expect(result.reserved_balance).toBe(300n);

      const record = store.getBalance(assetCode, assetIssuer);
      expect(record.available_balance + record.reserved_balance).toBe(800n);
    });

    it('should throw error if insufficient reserved for settle', async () => {
      await expect(store.settle(assetCode, assetIssuer, 1n)).rejects.toThrow(
        InsufficientReservedBalanceError,
      );
    });
  });

  describe('Invariant Verification', () => {
    it('should maintain available + reserved equals total tracked after every op', async () => {
      await store.mint(assetCode, assetIssuer, 1000n);
      expect(store.getTotalTracked(assetCode, assetIssuer)).toBe(1000n);

      await store.reserve(assetCode, assetIssuer, 300n);
      expect(store.getTotalTracked(assetCode, assetIssuer)).toBe(1000n);

      await store.release(assetCode, assetIssuer, 100n);
      expect(store.getTotalTracked(assetCode, assetIssuer)).toBe(1000n);

      await store.settle(assetCode, assetIssuer, 200n);
      expect(store.getTotalTracked(assetCode, assetIssuer)).toBe(800n);

      await store.burn(assetCode, assetIssuer, 300n);
      expect(store.getTotalTracked(assetCode, assetIssuer)).toBe(500n);
    });
  });
});
