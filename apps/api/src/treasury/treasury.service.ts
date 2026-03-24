import { Injectable } from '@nestjs/common';
import { AssetReserve } from './interfaces/proof-of-reserves.interface';
import { apiLogger } from '../observability';

const serviceLogger = apiLogger.child({
  serviceContext: 'TreasuryService',
});

@Injectable()
export class TreasuryService {
  async getTotalSupply(_assetCode: string): Promise<string> {
    // TODO: Implement actual on-chain supply query using @stellar/stellar-sdk
    // Example:
    // const horizon = new Horizon.Server(process.env.STELLAR_HORIZON_URL);
    // const asset = new Asset(assetCode, process.env.ISSUER_PUBLIC_KEY);
    // const accounts = await horizon.accounts().forAsset(asset).call();
    // return accounts.records.reduce((sum, acc) => {
    //   const balance = acc.balances.find((b: any) => b.asset_code === assetCode);
    //   return sum + (balance ? parseFloat(balance.balance) : 0);
    // }, 0).toString();
    serviceLogger.debug('Fetching total supply placeholder response', {
      event: 'treasury_total_supply_requested',
      assetCode: _assetCode,
    });
    return '0';
  }

  async getTreasuryBalance(_assetCode: string, _treasuryAddress: string): Promise<string> {
    // TODO: Implement actual treasury cold storage balance query
    // Example:
    // const horizon = new Horizon.Server(process.env.STELLAR_HORIZON_URL);
    // const account = await horizon.loadAccount(treasuryAddress);
    // const balance = account.balances.find((b: any) => b.asset_code === assetCode);
    // return balance?.balance ?? '0';
    serviceLogger.debug('Fetching treasury balance placeholder response', {
      event: 'treasury_balance_requested',
      assetCode: _assetCode,
      treasuryAddress: _treasuryAddress,
    });
    return '0';
  }

  calculateReserveRatio(treasuryBalance: string, totalSupply: string): number {
    const treasury = parseFloat(treasuryBalance);
    const supply = parseFloat(totalSupply);

    if (supply === 0) return 0;

    return Math.round((treasury / supply) * 10000) / 100; // Return as percentage with 2 decimals
  }

  async getAssetReserve(assetCode: string): Promise<AssetReserve> {
    // TODO: Get treasury address from config service
    // const treasuryAddress = await this.configService.getTreasuryAddress();
    const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS ?? 'TREASURY_ADDRESS_NOT_SET';

    if (treasuryAddress === 'TREASURY_ADDRESS_NOT_SET') {
      serviceLogger.warn('Treasury wallet address missing, using placeholder', {
        event: 'treasury_wallet_address_missing',
        assetCode,
      });
    }

    const [totalSupply, treasuryBalance] = await Promise.all([
      this.getTotalSupply(assetCode),
      this.getTreasuryBalance(assetCode, treasuryAddress),
    ]);

    const reserveRatio = this.calculateReserveRatio(treasuryBalance, totalSupply);

    serviceLogger.info('Computed asset reserve snapshot', {
      event: 'treasury_asset_reserve_computed',
      assetCode,
      totalSupply,
      treasuryBalance,
      reserveRatio,
    });

    return {
      symbol: assetCode,
      total_supply: totalSupply,
      treasury_balance: treasuryBalance,
      reserve_ratio: reserveRatio,
    };
  }
}
