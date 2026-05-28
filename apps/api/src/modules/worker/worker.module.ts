import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WithdrawalProcessor } from './withdrawal.processor';
import { BlockchainWatcher } from './blockchain-watcher.service';
import { RedemptionRepository } from '../database/redemption.repository';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [WithdrawalProcessor, BlockchainWatcher, RedemptionRepository],
  exports: [BlockchainWatcher, RedemptionRepository],
})
export class WorkerModule {}
