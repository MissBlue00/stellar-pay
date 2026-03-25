import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { RedeemDto, RedeemResponse } from './interfaces/redemption.interface';
import { ProofOfReservesResponse } from './interfaces/proof-of-reserves.interface';
import { TreasuryService } from './treasury.service';
import { RedemptionService } from './redemption.service';

@Controller('treasury')
export class TreasuryController {
  constructor(
    private readonly treasuryService: TreasuryService,
    private readonly redemptionService: RedemptionService,
  ) {}

  @Get('reserves')
  async getProofOfReserves(): Promise<ProofOfReservesResponse> {
    // TODO: Get supported assets from config service
    const supportedAssets = (process.env.SUPPORTED_ASSETS ?? 'USDC,ARS').split(',');

    const reserves = await Promise.all(
      supportedAssets.map((asset) => this.treasuryService.getAssetReserve(asset.trim())),
    );

    return {
      timestamp: new Date().toISOString(),
      network: process.env.STELLAR_NETWORK ?? 'TESTNET',
      reserves,
    };
  }

  /**
   * Redeem mirror assets back to the underlying base currency.
   * Requires a valid JWT (merchant_id extracted from token).
   * Body: RedeemDto — asset_code, amount, merchant_wallet, destination_address
   */
  @Post('redeem')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async redeem(@Request() req: any, @Body() dto: RedeemDto): Promise<RedeemResponse> {
    const { merchant_id } = req.user as { merchant_id: string };
    return this.redemptionService.redeem(merchant_id, dto);
  }
}
