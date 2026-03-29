import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WithdrawalProcessor } from './withdrawal.processor';
import { RedemptionRepository } from '../database/redemption.repository';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [WithdrawalProcessor, RedemptionRepository],
})
export class WorkerModule {}
