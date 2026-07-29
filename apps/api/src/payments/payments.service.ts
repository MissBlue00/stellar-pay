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

  findAll(
    merchantId: string,
    opts: {
      page: number;
      limit: number;
      status?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): { data: StoredIntent[]; total: number; page: number; limit: number; totalPages: number } {
    let results = this.payments.filter((p) => p.merchantId === merchantId);

    if (opts.status) {
      results = results.filter((p) => p.status === opts.status);
    }

    if (opts.search) {
      const q = opts.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.paymentId.toLowerCase().includes(q) ||
          p.paymentReference.toLowerCase().includes(q) ||
          p.currency.toLowerCase().includes(q) ||
          (p.reference && p.reference.toLowerCase().includes(q)),
      );
    }

    if (opts.sortBy) {
      const order = opts.sortOrder === 'asc' ? 1 : -1;
      results.sort((a, b) => {
        const key = opts.sortBy as keyof StoredIntent;
        const fa = a[key] as unknown;
        const fb = b[key] as unknown;
        if (fa == null && fb == null) return 0;
        if (fa == null) return 1 * order;
        if (fb == null) return -1 * order;
        if (typeof fa === 'number' && typeof fb === 'number') return (fa - fb) * order;
        const sa = String(fa).toLowerCase();
        const sb = String(fb).toLowerCase();
        if (sa < sb) return -1 * order;
        if (sa > sb) return 1 * order;
        return 0;
      });
    } else {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = results.length;
    const start = (opts.page - 1) * opts.limit;
    const data = results.slice(start, start + opts.limit);

    const totalPages = Math.max(1, Math.ceil(total / opts.limit));

    return { data, total, page: opts.page, limit: opts.limit, totalPages };
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
