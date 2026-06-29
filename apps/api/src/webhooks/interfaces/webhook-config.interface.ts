import { WebhookEventType } from './webhook-event.interface';

export interface WebhookConfig {
  id: string;
  merchant_id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookConfigDto {
  url: string;
  events: WebhookEventType[];
  enabled?: boolean;
}

export interface UpdateWebhookConfigDto {
  url?: string;
  events?: WebhookEventType[];
  enabled?: boolean;
}
