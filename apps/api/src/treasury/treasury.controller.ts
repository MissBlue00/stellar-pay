import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TreasuryService } from './treasury.service';
import { ProofOfReservesResponse, RedeemResponse } from './interfaces/proof-of-reserves.interface';
import { RedeemDto } from './dto/redeem.dto';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';

@ApiTags('treasury')
@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('reserves')
  async getProofOfReserves(): Promise<ProofOfReservesResponse> {
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

  @Post('redeem')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Redeem mirror assets back to base currency' })
  @ApiResponse({
    status: 201,
    description: 'Redemption initiated successfully',
    schema: {
      type: 'object',
      properties: {
        redemption_id: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        destination: { type: 'string' },
        status: { type: 'string' },
        burn_tx_hash: { type: 'string' },
        created_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid request' })
  async redeem(
    @Body() dto: RedeemDto,
    @CurrentMerchant() merchant: MerchantUser,
  ): Promise<RedeemResponse> {
    return this.treasuryService.redeem(dto, merchant.merchant_id);
  }
}
