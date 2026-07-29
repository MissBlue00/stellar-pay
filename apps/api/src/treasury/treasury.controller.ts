import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TreasuryService } from './treasury.service';
import {
  ProofOfReservesResponse,
  RedeemResponse,
  TreasuryBalanceResponse,
} from './interfaces/proof-of-reserves.interface';
import { RedeemDto } from './dto/redeem.dto';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';

@ApiTags('treasury')
@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('balance')
  async getBalance(): Promise<TreasuryBalanceResponse> {
    const supportedAssets = (process.env.SUPPORTED_ASSETS ?? 'USDC,ARS').split(',');
    const reserves = await Promise.all(
      supportedAssets.map((asset) => this.treasuryService.getAssetReserve(asset.trim())),
    );
    const totalValue = reserves.reduce(
      (sum, r) => sum + parseFloat(r.treasury_balance),
      0,
    );
    const totalReserves = reserves.reduce(
      (sum, r) => sum + parseFloat(r.total_supply),
      0,
    );
    return {
      total_treasury_value: totalValue,
      total_reserve_backing: totalReserves,
      active_assets: reserves.length,
      assets: reserves,
    };
  }

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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
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
