import { Injectable } from '@nestjs/common';
import { type CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';

export interface StoredIntent {
  paymentId: string;
  paymentReference: string;
  merchantId: string;
  amount: number;
  currency: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  status: 'pending';
  createdAt: string;
  expiresAt: string;
}

export interface CreatePaymentIntentResponse {
  payment_id: string;
  payment_reference: string;
  checkout_url: string;
  status: string;
  created_at: string;
  expires_at: string;
}

@Injectable()
export class PaymentsService {
  private readonly intents: Map<string, StoredIntent> = new Map();

  createPaymentIntent(
    dto: CreatePaymentIntentDto,
    merchantId: string,
  ): CreatePaymentIntentResponse {
    const paymentId = `pay_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;
    const paymentReference = `PAY-${Date.now()}-${crypto.randomUUID().split('-').join('').slice(0, 8).toUpperCase()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    const intent: StoredIntent = {
      paymentId,
      paymentReference,
      merchantId,
      amount: dto.amount,
      currency: dto.currency,
      reference: dto.reference,
      metadata: dto.metadata,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.intents.set(paymentId, intent);

    return {
      payment_id: paymentId,
      payment_reference: paymentReference,
      checkout_url: `https://checkout.stellarpay.io/pay/${paymentReference}`,
      status: 'pending',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };
  }

  findOne(paymentId: string): StoredIntent | undefined {
    return this.intents.get(paymentId);
  }
}
