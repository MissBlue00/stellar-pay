import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import { type MerchantUser } from '../auth/interfaces/merchant-user.interface';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService, type PaymentIntent } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intents')
  @HttpCode(HttpStatus.CREATED)
  createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentMerchant() merchant: MerchantUser,
  ): PaymentIntent {
    return this.paymentsService.createPaymentIntent(dto, merchant.merchant_id);
  }
}
