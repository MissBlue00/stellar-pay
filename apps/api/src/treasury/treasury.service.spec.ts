import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { TreasuryService } from './treasury.service';
import { TreasuryBalanceStore } from './treasury-balance.store';
import { Logger } from '@nestjs/common';

describe('TreasuryService', () => {
  let service: TreasuryService;
  let store: TreasuryBalanceStore;
  const assetCode = 'ARS';
  const assetIssuer = 'GDTREASURYADDRESSXXXXXX';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TreasuryService, TreasuryBalanceStore],
    }).compile();

    service = module.get<TreasuryService>(TreasuryService);
    store = module.get<TreasuryBalanceStore>(TreasuryBalanceStore);

    // Silence logger during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  describe('Ledger Operations', () => {
    it('should delegate mint to store and log success', async () => {
      const mintSpy = jest.spyOn(store, 'mint');
      const result = await service.mintAsset(assetCode, assetIssuer, 1000n);

      expect(mintSpy).toHaveBeenCalledWith(assetCode, assetIssuer, 1000n, undefined);
      expect(result.success).toBe(true);
    });

    it('should log error and throw if mint fails', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(store, 'mint').mockRejectedValue(new Error('Mint failed'));

      await expect(service.mintAsset(assetCode, assetIssuer, 1000n)).rejects.toThrow('Mint failed');
      expect(errorSpy).toHaveBeenCalledWith('Mint failed for ARS: Mint failed');
    });

    it('should delegate burn to store and log success', async () => {
      await store.mint(assetCode, assetIssuer, 2000n);
      const burnSpy = jest.spyOn(store, 'burn');
      const result = await service.burnAsset(assetCode, assetIssuer, 500n);

      expect(burnSpy).toHaveBeenCalledWith(assetCode, assetIssuer, 500n);
      expect(result.available_balance).toBe(1500n);
    });

    it('should log error and throw if burn fails', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      jest.spyOn(store, 'burn').mockRejectedValue(new Error('Burn failed'));

      await expect(service.burnAsset(assetCode, assetIssuer, 500n)).rejects.toThrow('Burn failed');
      expect(errorSpy).toHaveBeenCalledWith('Burn failed for ARS: Burn failed');
    });

    it('should delegate reserve/release/settle correctly', async () => {
      await store.mint(assetCode, assetIssuer, 1000n);

      await service.reserveFunds(assetCode, assetIssuer, 300n);
      expect(store.getTotalTracked(assetCode, assetIssuer)).toBe(1000n);

      await service.releaseFunds(assetCode, assetIssuer, 100n);
      expect(store.getTotalTracked(assetCode, assetIssuer)).toBe(1000n);

      await service.settleFunds(assetCode, assetIssuer, 200n);
      expect(store.getTotalTracked(assetCode, assetIssuer)).toBe(800n);
    });

    it('should log error and throw if reserve/release/settle fails', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      jest.spyOn(store, 'reserve').mockRejectedValue(new Error('Reserve failed'));
      await expect(service.reserveFunds(assetCode, assetIssuer, 1n)).rejects.toThrow(
        'Reserve failed',
      );
      expect(errorSpy).toHaveBeenCalledWith('Reserve failed for ARS: Reserve failed');

      jest.spyOn(store, 'release').mockRejectedValue(new Error('Release failed'));
      await expect(service.releaseFunds(assetCode, assetIssuer, 1n)).rejects.toThrow(
        'Release failed',
      );
      expect(errorSpy).toHaveBeenCalledWith('Release failed for ARS: Release failed');

      jest.spyOn(store, 'settle').mockRejectedValue(new Error('Settle failed'));
      await expect(service.settleFunds(assetCode, assetIssuer, 1n)).rejects.toThrow(
        'Settle failed',
      );
      expect(errorSpy).toHaveBeenCalledWith('Settle failed for ARS: Settle failed');
    });
  });

  describe('Query Methods', () => {
    it('should return 0 strings for missing assets in getTreasuryBalance', async () => {
      const balance = await service.getTreasuryBalance('MISSING', assetIssuer);
      expect(balance).toBe('0');
    });

    it('should return tracked balance as string', async () => {
      await store.mint(assetCode, assetIssuer, 1234567n);
      const balance = await service.getTreasuryBalance(assetCode, assetIssuer);
      expect(balance).toBe('1234567');
    });

    it('should return total tracked balance as bigint', async () => {
      await store.mint(assetCode, assetIssuer, 100n);
      await store.reserve(assetCode, assetIssuer, 50n);
      expect(service.getTotalTrackedBalance(assetCode, assetIssuer)).toBe(100n);
    });

    it('should return full internal balance record', async () => {
      await store.mint(assetCode, assetIssuer, 100n);
      const record = service.getInternalBalance(assetCode, assetIssuer);
      expect(record.available_balance).toBe(100n);
      expect(record.asset_code).toBe(assetCode);
    });

    it('should return 0 in calculateReserveRatio if supply is zero', () => {
      expect(service.calculateReserveRatio('1000', '0')).toBe(0);
    });
  });

  describe('Proof of Reserves Integration', () => {
    it('should return asset reserve object with internal balance', async () => {
      process.env.TREASURY_ISSUER_ADDRESS = assetIssuer;
      await store.mint(assetCode, assetIssuer, 5000n);

      const reserve = await service.getAssetReserve(assetCode);
      expect(reserve.symbol).toBe(assetCode);
      expect(reserve.treasury_balance).toBe('5000');
      expect(reserve.total_supply).toBe('0');
    });

    it('should calculate non-zero reserve ratio if supply is provided', async () => {
      jest.spyOn(service, 'getTotalSupply').mockResolvedValue('10000');
      await store.mint(assetCode, assetIssuer, 5000n);

      const reserve = await service.getAssetReserve(assetCode);
      expect(reserve.reserve_ratio).toBe(50); // 5000/10000 = 50%
    });

    it('should return 0 strings if getTreasuryBalance fails inside proof-of-reserves', async () => {
      jest.spyOn(store, 'getTotalTracked').mockImplementation(() => {
        throw new Error('Store failure');
      });
      const balance = await service.getTreasuryBalance(assetCode, assetIssuer);
      expect(balance).toBe('0');
    });
  });
});
