import { Module } from '@nestjs/common';
import { TransactionMonitorService } from './transaction-monitor.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { WebhookModule } from '../webhooks/webhook.module';

@Module({
  imports: [WebhookModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionMonitorService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
