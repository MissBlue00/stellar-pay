import { Controller, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { CurrentMerchant } from '../../auth/decorators/current-merchant.decorator';
import { MerchantUser } from '../../auth/interfaces/merchant-user.interface';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment intent' })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('ApiKey-auth')
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully.',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment parameters provided.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized merchant authentication.',
  })
  async createPayment(
    @CurrentMerchant() merchant: MerchantUser,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.createPaymentIntent(merchant.merchant_id, createPaymentDto);
  }
}
