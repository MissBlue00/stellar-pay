import { Controller, Get } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { ProofOfReservesResponse } from './interfaces/proof-of-reserves.interface';
import { apiLogger } from '../observability';

const controllerLogger = apiLogger.child({
  controller: 'TreasuryController',
});

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('reserves')
  async getProofOfReserves(): Promise<ProofOfReservesResponse> {
    // TODO: Get supported assets from config service
    // const supportedAssets = await this.configService.getSupportedAssets();
    const supportedAssets = (process.env.SUPPORTED_ASSETS ?? 'USDC,ARS').split(',');

    controllerLogger.info('Generating proof of reserves snapshot', {
      event: 'treasury_proof_of_reserves_requested',
      supportedAssets: supportedAssets.map((asset) => asset.trim()),
    });

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
