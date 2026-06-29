export enum WebhookEventType {
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_DETECTED = 'payment.detected',
  PAYMENT_CONFIRMED = 'payment.confirmed',
  PAYMENT_FAILED = 'payment.failed',
}

export interface WebhookEventPayload {
  event: WebhookEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface WebhookDeliveryAttempt {
  id: string;
  merchantId: string;
  url: string;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookJobData {
  webhookId: string;
  eventId: string;
  merchantId: string;
  url: string;
  status: 'pending' | 'success' | 'failed';
  response_code?: number;
  response_body?: string;
  error_message?: string;
  attempt_number: number;
  created_at: string;
  delivered_at?: string;
}
