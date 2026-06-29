import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';
import { WebhookService } from '../webhooks/webhook.service';
import { WebhookEventType } from '../webhooks/interfaces/webhook-event.interface';

export type PaymentStatus = 'pending' | 'detected' | 'confirmed' | 'failed';

export interface StoredIntent {
  paymentId: string;
  paymentReference: string;
  merchantId: string;
  amount: number;
  currency: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
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

// Alias used by tests and other services
export type PaymentIntent = StoredIntent & { id: string };

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly payments: StoredIntent[] = [];

  constructor(private readonly webhookService: WebhookService) {}

  createPaymentIntent(
    dto: CreatePaymentIntentDto,
    merchantId: string,
  ): StoredIntent & { id: string } {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const id = crypto.randomUUID();
    const paymentReference = `PAY-${Date.now()}-${crypto.randomUUID().split('-').join('').slice(0, 8).toUpperCase()}`;

    const payment: StoredIntent & { id: string } = {
      id,
      paymentId: id,
      paymentReference,
      merchantId,
      amount: dto.amount,
      currency: dto.currency,
      reference: dto.reference,
      metadata: dto.metadata,
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.payments.push(payment);

    this.webhookService
      .dispatchEvent(merchantId, WebhookEventType.PAYMENT_CREATED, {
        payment_id: payment.id,
        payment_reference: payment.paymentReference,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        metadata: payment.metadata,
        created_at: payment.createdAt,
      })
      .catch((err: Error) => {
        this.logger.error(`Webhook dispatch failed for payment.created: ${err.message}`);
      });

    return payment;
  }

  markDetected(id: string): StoredIntent & { id: string } {
    return this.updateStatus(id, 'detected', WebhookEventType.PAYMENT_DETECTED);
  }

  markConfirmed(id: string): StoredIntent & { id: string } {
    return this.updateStatus(id, 'confirmed', WebhookEventType.PAYMENT_CONFIRMED);
  }

  markFailed(id: string): StoredIntent & { id: string } {
    return this.updateStatus(id, 'failed', WebhookEventType.PAYMENT_FAILED);
  }

  findOne(paymentId: string): StoredIntent | undefined {
    return this.payments.find((p) => p.paymentId === paymentId);
  }

  findOneOrFail(paymentId: string): StoredIntent & { id: string } {
    const payment = this.payments.find((p) => p.paymentId === paymentId) as
      (StoredIntent & { id: string }) | undefined;
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    return payment;
  }

  private updateStatus(
    id: string,
    status: PaymentStatus,
    event: WebhookEventType,
  ): StoredIntent & { id: string } {
    const payment = this.payments.find((p) => p.paymentId === id) as
      (StoredIntent & { id: string }) | undefined;
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    payment.status = status;
    payment.updatedAt = new Date().toISOString();

    this.webhookService
      .dispatchEvent(payment.merchantId, event, {
        payment_id: payment.id,
        payment_reference: payment.paymentReference,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        metadata: payment.metadata,
        updated_at: payment.updatedAt,
      })
      .catch((err: Error) => {
        this.logger.error(`Webhook dispatch failed for ${event}: ${err.message}`);
      });

    return payment;
  }
}
