import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentsRepository, PaymentIntent } from '../database/payments.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepo: PaymentsRepository) {}

  async createPaymentIntent(
    merchantId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (!dto.currency) {
      throw new BadRequestException('Currency is required');
    }

    // 1. Generate unique payment_id and unique payment_reference
    const paymentId = `pay_${crypto.randomBytes(12).toString('hex')}`;
    const paymentReference = `ref_${crypto.randomBytes(12).toString('hex')}`;

    // 2. Construct hosted checkout URL
    const baseUrl = process.env.CHECKOUT_BASE_URL || 'https://checkout.stellar-pay.com';
    const checkoutUrl = `${baseUrl}/pay/${paymentId}`;

    // 3. Store intent with pending status
    await this.paymentsRepo.create({
      payment_id: paymentId,
      merchant_id: merchantId,
      amount: dto.amount,
      currency: dto.currency,
      status: 'pending',
      payment_reference: paymentReference,
      checkout_url: checkoutUrl,
      destination: dto.destination,
      description: dto.description,
    });

    return {
      payment_id: paymentId,
      payment_reference: paymentReference,
      checkout_url: checkoutUrl,
    };
  }

  async getPaymentIntent(paymentId: string): Promise<PaymentIntent | undefined> {
    return this.paymentsRepo.findById(paymentId);
  }
}
