import { Module } from '@nestjs/common';
import { MerchantsService } from './merchants.service';

@Module({
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
