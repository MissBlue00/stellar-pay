import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import {
  WebhookDeliveryResult,
  WebhookEndpoint,
  WebhookEventPayload,
  PaymentWebhookEventType,
} from './interfaces/webhook-event.interface';

const PAYMENT_WEBHOOK_EVENTS: PaymentWebhookEventType[] = [
  'payment.created',
  'payment.detected',
  'payment.confirmed',
  'payment.failed',
];

@Injectable()
export class WebhooksService {
  createPayload<TData>(
    event: PaymentWebhookEventType,
    data: TData,
    date = new Date(),
  ): WebhookEventPayload<TData> {
    this.ensureSupportedEvent(event);

    return {
      event,
      data,
      timestamp: date.toISOString(),
    };
  }

  createSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  async dispatchEvent<TData>(
    endpoint: WebhookEndpoint,
    event: PaymentWebhookEventType,
    data: TData,
    payload = this.createPayload(event, data),
  ): Promise<WebhookDeliveryResult> {
    if (!endpoint.url) {
      throw new BadRequestException('Webhook endpoint url is required');
    }

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'user-agent': 'stellar-pay-webhooks/1.0',
      'x-stellar-pay-event': payload.event,
      'x-stellar-pay-timestamp': payload.timestamp,
    };

    if (endpoint.secret) {
      headers['x-stellar-pay-signature'] = this.createSignature(body, endpoint.secret);
    }

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(this.getTimeoutMs()),
    });

    return {
      endpoint: endpoint.url,
      event: payload.event,
      timestamp: payload.timestamp,
      ok: response.ok,
      status: response.status,
      responseBody: await response.text(),
    };
  }

  async dispatchToEndpoints<TData>(
    endpoints: WebhookEndpoint[],
    event: PaymentWebhookEventType,
    data: TData,
  ): Promise<{ payload: WebhookEventPayload<TData>; deliveries: WebhookDeliveryResult[] }> {
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      throw new BadRequestException('At least one webhook endpoint is required');
    }

    const payload = this.createPayload(event, data);
    const deliveries = await Promise.all(
      endpoints.map((endpoint) => this.dispatchEvent(endpoint, event, data, payload)),
    );

    return {
      payload,
      deliveries,
    };
  }

  private ensureSupportedEvent(event: PaymentWebhookEventType) {
    if (!PAYMENT_WEBHOOK_EVENTS.includes(event)) {
      throw new BadRequestException(`Unsupported webhook event: ${event}`);
    }
  }

  private getTimeoutMs(): number {
    const rawTimeout = process.env.WEBHOOK_TIMEOUT_MS;
    const timeout = Number.parseInt(rawTimeout ?? '5000', 10);

    return Number.isNaN(timeout) || timeout <= 0 ? 5000 : timeout;
  }
}
