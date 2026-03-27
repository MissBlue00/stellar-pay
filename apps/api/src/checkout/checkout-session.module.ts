import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutSessionEntity } from './entities/checkout-session.entity';
import { CheckoutSessionService } from './checkout-session.service';
import { CheckoutSessionController } from './checkout-session.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CheckoutSessionEntity])],
  controllers: [CheckoutSessionController],
  providers: [CheckoutSessionService],
  exports: [CheckoutSessionService], // Export for use in other modules
})
export class CheckoutSessionModule {}
