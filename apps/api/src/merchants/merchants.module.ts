import { Module } from '@nestjs/common';
import { MerchantsController } from './merchants.controller';

@Module({
  controllers: [MerchantsController],
})
export class MerchantsModule {}
