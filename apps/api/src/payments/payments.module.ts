import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { DepositAddressService } from './deposit-address.service.js';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, DepositAddressService],
})
export class PaymentsModule {}
