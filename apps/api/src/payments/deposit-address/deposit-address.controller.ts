import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { DepositAddressService } from './deposit-address.service';
import { GenerateDepositAddressDto } from './dto/generate-deposit-address.dto';
import { Chain } from './enums/chain.enum';
import { type DepositAddress } from './interfaces/deposit-address.interface';

@Controller('payments/intents/:intentId/deposit-address')
export class DepositAddressController {
  constructor(private readonly depositAddressService: DepositAddressService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  generate(
    @Param('intentId') intentId: string,
    @Body() dto: GenerateDepositAddressDto,
  ): DepositAddress {
    return this.depositAddressService.generate(intentId, dto);
  }

  @Get()
  findAll(@Param('intentId') intentId: string): DepositAddress[] {
    return this.depositAddressService.findAllByIntent(intentId);
  }

  @Get(':chain')
  findOne(@Param('intentId') intentId: string, @Param('chain') chain: Chain): DepositAddress {
    return this.depositAddressService.findByIntentAndChain(intentId, chain);
  }
}
