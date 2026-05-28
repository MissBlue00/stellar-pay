import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator.js';
import { type MerchantUser } from '../auth/interfaces/merchant-user.interface.js';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';
import { GenerateDepositAddressDto } from './dto/generate-deposit-address.dto.js';
import { PaymentsService, type CreatePaymentIntentResponse } from './payments.service.js';
import { DepositAddressService } from './deposit-address.service.js';
import { DepositAddress } from './interfaces/deposit-address.interface.js';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly depositAddressService: DepositAddressService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new payment intent' })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    schema: {
      type: 'object',
      properties: {
        payment_id: { type: 'string' },
        payment_reference: { type: 'string' },
        checkout_url: { type: 'string' },
        status: { type: 'string' },
        created_at: { type: 'string' },
        expires_at: { type: 'string' },
      },
    },
  })
  createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentMerchant() merchant: MerchantUser,
  ): CreatePaymentIntentResponse {
    return this.paymentsService.createPaymentIntent(dto, merchant.merchant_id);
  }

  @Post(':paymentId/deposit-address')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate a deposit address for a payment intent' })
  @ApiResponse({
    status: 201,
    description: 'Deposit address generated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        payment_id: { type: 'string' },
        network: { type: 'string' },
        address: { type: 'string' },
        memo: { type: 'string' },
        derivation_path: { type: 'string' },
        created_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  async generateDepositAddress(
    @Param('paymentId') paymentId: string,
    @Body() dto: GenerateDepositAddressDto,
    @CurrentMerchant() merchant: MerchantUser,
  ): Promise<DepositAddress> {
    const intent = this.paymentsService.findOne(paymentId);
    if (!intent) throw new NotFoundException('Payment intent not found');
    if (intent.merchantId !== merchant.merchant_id) {
      throw new NotFoundException('Payment intent not found');
    }
    return this.depositAddressService.generateAddress(paymentId, dto.network);
  }

  @Get(':paymentId/deposit-addresses')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List deposit addresses for a payment intent' })
  getDepositAddresses(@Param('paymentId') paymentId: string): DepositAddress[] {
    return this.depositAddressService.getAddressesByPaymentId(paymentId);
  }
}
