import { Module } from '@nestjs/common';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from './treasury.service';
import { RedemptionService } from './redemption.service';

@Module({
  controllers: [TreasuryController],
  providers: [TreasuryService, RedemptionService],
})
export class TreasuryModule {}
