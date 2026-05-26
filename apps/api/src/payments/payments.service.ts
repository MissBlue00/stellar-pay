import { Injectable, NotFoundException } from '@nestjs/common';
import { type CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';
import { WebhookService } from '../webhooks/webhook.service';
import { WebhookEventType } from '../webhooks/interfaces/webhook-event.interface';

export type PaymentStatus = 'pending' | 'detected' | 'confirmed' | 'failed';

export interface PaymentIntent {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PaymentsService {
  private readonly payments: PaymentIntent[] = [];

  constructor(private readonly webhookService: WebhookService) {}

  createPaymentIntent(dto: CreatePaymentIntentDto, merchantId: string): PaymentIntent {
    const now = new Date().toISOString();
    const payment: PaymentIntent = {
      id: crypto.randomUUID(),
      merchantId,
      amount: dto.amount,
      currency: dto.currency,
      metadata: dto.metadata,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.payments.push(payment);

    void this.webhookService.dispatchEvent(merchantId, WebhookEventType.PAYMENT_CREATED, {
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      metadata: payment.metadata,
      created_at: payment.createdAt,
    });

    return payment;
  }

  markDetected(id: string): PaymentIntent {
    return this.updateStatus(id, 'detected', WebhookEventType.PAYMENT_DETECTED);
  }

  markConfirmed(id: string): PaymentIntent {
    return this.updateStatus(id, 'confirmed', WebhookEventType.PAYMENT_CONFIRMED);
  }

  markFailed(id: string): PaymentIntent {
    return this.updateStatus(id, 'failed', WebhookEventType.PAYMENT_FAILED);
  }

  private updateStatus(id: string, status: PaymentStatus, event: WebhookEventType): PaymentIntent {
    const payment = this.payments.find((p) => p.id === id);
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    payment.status = status;
    payment.updatedAt = new Date().toISOString();

    void this.webhookService.dispatchEvent(payment.merchantId, event, {
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      metadata: payment.metadata,
      updated_at: payment.updatedAt,
    });

    return payment;
  }
}
