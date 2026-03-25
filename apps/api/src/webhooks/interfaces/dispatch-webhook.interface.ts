import {
  PaymentWebhookEventType,
  WebhookDeliveryResult,
  WebhookEndpoint,
  WebhookEventPayload,
} from './webhook-event.interface';

export interface DispatchWebhookRequest<TData = unknown> {
  event: PaymentWebhookEventType;
  data: TData;
  endpoints: WebhookEndpoint[];
}

export interface DispatchWebhookResponse<TData = unknown> {
  payload: WebhookEventPayload<TData>;
  deliveries: WebhookDeliveryResult[];
}
