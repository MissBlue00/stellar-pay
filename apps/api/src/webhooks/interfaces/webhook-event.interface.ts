export interface WebhookEvent {
  webhookId: string;
  merchantId: string;
  url: string;
  secret: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface WebhookDelivery {
  webhookId: string;
  eventId: string;
  merchantId: string;
  url: string;
  type: string;
  attempt: number;
  status: 'success' | 'failed';
  statusCode?: number;
  error?: string;
  deliveredAt: string;
}

export interface WebhookEndpointRecord {
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
  secret: string;
  type: string;
  payload: Record<string, unknown>;
  attempt: number;
  maxAttempts: number;
}
