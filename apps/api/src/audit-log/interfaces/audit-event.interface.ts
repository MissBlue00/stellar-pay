export type AuditEventType =
  | 'auth.login'
  | 'auth.register'
  | 'api_key.changed'
  | 'payment.initiated'
  | 'redemption.created'
  | 'webhook.config_changed';

export type AuditMetadata = Record<string, unknown>;

export interface RecordAuditEventRequest {
  merchant_id: string;
  event_type: AuditEventType;
  metadata: AuditMetadata;
  ip: string;
}
