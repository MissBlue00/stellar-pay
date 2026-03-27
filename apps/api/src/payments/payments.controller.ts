import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';

@Controller('payments')
@UseInterceptors(ClassSerializerInterceptor)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a new payment intent
   *
   * POST /payments
   *
   * Authenticated endpoint that creates a payment intent for a merchant.
   * The endpoint validates the merchant identity via JWT token and generates
   * a unique payment_reference along with a checkout_url.
   *
   * @param merchant - Authenticated merchant from JWT token
   * @param dto - Payment intent creation data
   * @returns PaymentIntentResponseDto with payment_id, payment_reference, and checkout_url
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPaymentIntent(
    @CurrentMerchant() merchant: MerchantUser,
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    if (!merchant || !merchant.merchant_id) {
      throw new BadRequestException('Merchant identity not found in JWT token');
    }

    return this.paymentsService.createPaymentIntent(merchant.merchant_id, dto);
  }

  /**
   * Get a specific payment intent by ID
   *
   * GET /payments/:paymentId
   *
   * @param merchant - Authenticated merchant from JWT token
   * @param paymentId - Payment intent ID
   * @returns PaymentIntentResponseDto
   */
  @Get(':paymentId')
  @HttpCode(HttpStatus.OK)
  async getPaymentIntent(
    @CurrentMerchant() merchant: MerchantUser,
    @Param('paymentId') paymentId: string,
  ): Promise<PaymentIntentResponseDto> {
    if (!merchant || !merchant.merchant_id) {
      throw new BadRequestException('Merchant identity not found in JWT token');
    }

    const intent = await this.paymentsService.getPaymentIntent(paymentId, merchant.merchant_id);

    if (!intent) {
      throw new NotFoundException(`Payment intent with ID ${paymentId} not found`);
    }

    return intent;
  }

  /**
   * Get all payment intents for the authenticated merchant
   *
   * GET /payments
   *
   * @param merchant - Authenticated merchant from JWT token
   * @returns Array of PaymentIntentResponseDto
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMerchantPaymentIntents(
    @CurrentMerchant() merchant: MerchantUser,
  ): Promise<PaymentIntentResponseDto[]> {
    if (!merchant || !merchant.merchant_id) {
      throw new BadRequestException('Merchant identity not found in JWT token');
    }

    return this.paymentsService.getMerchantPaymentIntents(merchant.merchant_id);
  }
}
