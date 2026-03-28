import { Controller, Get } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { ProofOfReservesResponse } from './interfaces/proof-of-reserves.interface';

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('reserves')
  async getProofOfReserves(): Promise<ProofOfReservesResponse> {
    // TODO: Get supported assets from config service
    // const supportedAssets = await this.configService.getSupportedAssets();
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
}
