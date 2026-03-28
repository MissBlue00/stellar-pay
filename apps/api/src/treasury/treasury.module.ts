import { Module } from '@nestjs/common';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from './treasury.service';
import { TreasuryBalanceStore } from './treasury-balance.store';

@Module({
  controllers: [TreasuryController],
  providers: [TreasuryService, TreasuryBalanceStore],
  exports: [TreasuryService, TreasuryBalanceStore],
})
export class TreasuryModule {}
