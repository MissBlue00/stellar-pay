import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { WebhookModule } from '../webhooks/webhook.module';
import { DepositAddressService } from './deposit-address.service.js';

@Module({
  imports: [WebhookModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, DepositAddressService],
})
export class PaymentsModule {}
