import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, createHmac, randomUUID } from 'crypto';
import type { RecordAuditEventRequest, AuditEventType } from './interfaces/audit-event.interface';
import type { AuditLogEntry, AuditTrailVerificationResult } from './interfaces/audit-log.interface';

const AUDIT_EVENT_TYPES: AuditEventType[] = [
  'auth.login',
  'auth.register',
  'api_key.changed',
  'payment.initiated',
  'redemption.created',
  'webhook.config_changed',
];

@Injectable()
export class AuditLogService {
  private readonly entries: AuditLogEntry[] = [];

  recordEvent(request: RecordAuditEventRequest, date = new Date()): AuditLogEntry {
    this.ensureValidEventType(request.event_type);

    if (!request.merchant_id) {
      throw new BadRequestException('merchant_id is required');
    }

    if (!request.ip) {
      throw new BadRequestException('ip is required');
    }

    const previousEntry = this.entries.at(-1);
    const entry: AuditLogEntry = {
      id: randomUUID(),
      merchant_id: request.merchant_id,
      event_type: request.event_type,
      metadata: request.metadata ?? {},
      ip: request.ip,
      timestamp: date.toISOString(),
      previous_hash: previousEntry?.entry_hash ?? null,
      entry_hash: '',
    };

    entry.entry_hash = this.computeEntryHash(entry);
    this.entries.push(entry);

    return entry;
  }

  listEntries(merchantId?: string): AuditLogEntry[] {
    const entries = merchantId
      ? this.entries.filter((entry) => entry.merchant_id === merchantId)
      : this.entries;

    return entries.map((entry) => ({ ...entry, metadata: { ...entry.metadata } }));
  }

  verifyTrail(merchantId?: string): AuditTrailVerificationResult {
    const entries = merchantId
      ? this.entries.filter((entry) => entry.merchant_id === merchantId)
      : this.entries;

    let previousHash: string | null = null;

    for (const entry of entries) {
      const expectedHash = this.computeEntryHash({
        ...entry,
        entry_hash: '',
      });

      if (entry.previous_hash !== previousHash || entry.entry_hash !== expectedHash) {
        return {
          valid: false,
          checked_entries: entries.length,
        };
      }

      previousHash = entry.entry_hash;
    }

    return {
      valid: true,
      checked_entries: entries.length,
    };
  }

  private ensureValidEventType(eventType: AuditEventType) {
    if (!AUDIT_EVENT_TYPES.includes(eventType)) {
      throw new BadRequestException(`Unsupported audit event type: ${eventType}`);
    }
  }

  private computeEntryHash(entry: Omit<AuditLogEntry, 'entry_hash'> & { entry_hash: string }) {
    const serializedEntry = this.serialize(entry);
    const secret = process.env.AUDIT_LOG_CHAIN_SECRET;

    if (secret) {
      return createHmac('sha256', secret).update(serializedEntry).digest('hex');
    }

    return createHash('sha256').update(serializedEntry).digest('hex');
  }

  private serialize(value: unknown): string {
    return JSON.stringify(this.normalize(value));
  }

  private normalize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalize(item));
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .reduce<Record<string, unknown>>((acc, [key, nestedValue]) => {
          acc[key] = this.normalize(nestedValue);
          return acc;
        }, {});
    }

    return value;
  }
}
