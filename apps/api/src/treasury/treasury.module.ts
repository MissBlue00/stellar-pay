/**
 * apps/api/src/treasury/treasury.module.ts
 *
 * Import this module into AppModule:
 *   imports: [TreasuryModule, ...]
 */

import { Module } from '@nestjs/common';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from './treasury.service';
import { WorkerModule } from '../modules/worker/worker.module';

@Module({
  imports: [WorkerModule],
  controllers: [TreasuryController],
  providers: [TreasuryService],
  // Export so payments-engine and other modules can inject TreasuryService
  exports: [TreasuryService],
})
export class TreasuryModule {}