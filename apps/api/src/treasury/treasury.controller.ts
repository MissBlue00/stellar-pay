import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TreasuryService } from './treasury.service';
import { ProofOfReservesResponse } from './interfaces/proof-of-reserves.interface';

@Controller('treasury')
export class TreasuryController {
  constructor(
    private readonly treasuryService: TreasuryService,
    private readonly configService: ConfigService,
  ) {}

  @Get('reserves')
  async getProofOfReserves(): Promise<ProofOfReservesResponse> {
    const supportedAssets = this.configService
      .get<string>('stellar.supportedAssets', 'USDC,ARS')
      .split(',');

    const reserves = await Promise.all(
      supportedAssets.map((asset) => this.treasuryService.getAssetReserve(asset.trim())),
    );

    return {
      timestamp: new Date().toISOString(),
      network: this.configService.get<string>('stellar.network', 'TESTNET'),
      reserves,
    };
  }
}
