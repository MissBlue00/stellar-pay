import type { AuditEventType, AuditMetadata } from './audit-event.interface';

export interface AuditLogEntry {
  id: string;
  merchant_id: string;
  event_type: AuditEventType;
  metadata: AuditMetadata;
  ip: string;
  timestamp: string;
  previous_hash: string | null;
  entry_hash: string;
}

export interface AuditTrailVerificationResult {
  valid: boolean;
  checked_entries: number;
}
