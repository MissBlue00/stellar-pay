import { Injectable, BadRequestException } from '@nestjs/common';
import { AssetReserve, RedeemResponse } from './interfaces/proof-of-reserves.interface';
import { RedemptionRepository } from '../modules/database/redemption.repository';
import { RedeemDto } from './dto/redeem.dto';

interface MerchantBalance {
  merchantId: string;
  asset: string;
  balance: number;
}

@Injectable()
export class TreasuryService {
  // In-memory merchant balances for validation (stub)
  private readonly merchantBalances: MerchantBalance[] = [];

  constructor(private readonly redemptionRepo: RedemptionRepository) {}

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

    return '0';
  }

  async getTreasuryBalance(_assetCode: string, _treasuryAddress: string): Promise<string> {
    // TODO: Implement actual treasury cold storage balance query
    // Example:
    // const horizon = new Horizon.Server(process.env.STELLAR_HORIZON_URL);
    // const account = await horizon.loadAccount(treasuryAddress);
    // const balance = account.balances.find((b: any) => b.asset_code === assetCode);
    // return balance?.balance ?? '0';

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

    const [totalSupply, treasuryBalance] = await Promise.all([
      this.getTotalSupply(assetCode),
      this.getTreasuryBalance(assetCode, treasuryAddress),
    ]);

    const reserveRatio = this.calculateReserveRatio(treasuryBalance, totalSupply);

    return {
      symbol: assetCode,
      total_supply: totalSupply,
      treasury_balance: treasuryBalance,
      reserve_ratio: reserveRatio,
    };
  }

  async redeem(dto: RedeemDto, merchantId: string): Promise<RedeemResponse> {
    // 1. Validate merchant has sufficient balance
    const balance = this.merchantBalances.find(
      (b) => b.merchantId === merchantId && b.asset === dto.currency,
    );

    if (!balance || balance.balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient ${dto.currency} balance. Available: ${balance?.balance ?? 0}, Requested: ${dto.amount}`,
      );
    }

    // 2. Invoke Soroban burn function (stub)
    // TODO: Call Soroban contract burn function when contract is deployed
    // const sorobanClient = new SorobanClient(process.env.SOROBAN_RPC_URL);
    // const burnTx = await sorobanClient.contractCall(
    //   process.env.MIRROR_ASSET_CONTRACT_ID,
    //   'burn',
    //   [merchantId, dto.amount, dto.currency],
    // );
    const burnTxHash = `burn_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;

    // 3. Deduct balance after successful burn
    balance.balance -= dto.amount;

    // 4. Create redemption record for withdrawal worker
    const redemptionId = `rdm_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;
    await this.redemptionRepo.create({
      id: redemptionId,
      status: 'PENDING',
      destinationAddress: dto.destination,
      amount: dto.amount.toString(),
    });

    return {
      redemption_id: redemptionId,
      amount: dto.amount,
      currency: dto.currency,
      destination: dto.destination,
      status: 'pending',
      burn_tx_hash: burnTxHash,
      created_at: new Date().toISOString(),
    };
  }
}
