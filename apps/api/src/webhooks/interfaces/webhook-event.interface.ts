export type PaymentWebhookEventType =
  | 'payment.created'
  | 'payment.detected'
  | 'payment.confirmed'
  | 'payment.failed';

export interface WebhookEndpoint {
  url: string;
  secret?: string;
}

export interface WebhookEventPayload<TData = unknown> {
  event: PaymentWebhookEventType;
  data: TData;
  timestamp: string;
}

export interface WebhookDeliveryResult {
  endpoint: string;
  event: PaymentWebhookEventType;
  timestamp: string;
  ok: boolean;
  status: number;
  responseBody: string;
}
