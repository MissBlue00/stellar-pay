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
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WorkerModule, PrismaModule],
  controllers: [TreasuryController],
  providers: [TreasuryService],
  exports: [TreasuryService],
})
export class TreasuryModule {}