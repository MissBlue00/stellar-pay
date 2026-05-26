import { Injectable } from '@nestjs/common';
import { type CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';

export interface PaymentIntent {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
  status: 'pending';
  createdAt: string;
}

@Injectable()
export class PaymentsService {
  createPaymentIntent(dto: CreatePaymentIntentDto, merchantId: string): PaymentIntent {
    return {
      id: crypto.randomUUID(),
      merchantId,
      amount: dto.amount,
      currency: dto.currency,
      metadata: dto.metadata,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }
}
