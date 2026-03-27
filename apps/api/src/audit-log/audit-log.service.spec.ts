import { BadRequestException } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(() => {
    service = new AuditLogService();
    process.env.AUDIT_LOG_CHAIN_SECRET = 'chain-secret';
  });

  afterEach(() => {
    delete process.env.AUDIT_LOG_CHAIN_SECRET;
  });

  it('records supported sensitive events with the required fields', () => {
    const entry = service.recordEvent(
      {
        merchant_id: 'merchant_123',
        event_type: 'payment.initiated',
        metadata: { amount: '100.00', currency: 'USD' },
        ip: '127.0.0.1',
      },
      new Date('2026-03-25T10:00:00.000Z'),
    );

    expect(entry).toEqual({
      id: expect.any(String),
      merchant_id: 'merchant_123',
      event_type: 'payment.initiated',
      metadata: { amount: '100.00', currency: 'USD' },
      ip: '127.0.0.1',
      timestamp: '2026-03-25T10:00:00.000Z',
      previous_hash: null,
      entry_hash: expect.any(String),
    });
  });

  it('chains entries together to make the trail tamper-evident', () => {
    const first = service.recordEvent({
      merchant_id: 'merchant_123',
      event_type: 'auth.login',
      metadata: { method: 'password' },
      ip: '127.0.0.1',
    });
    const second = service.recordEvent({
      merchant_id: 'merchant_123',
      event_type: 'api_key.changed',
      metadata: { action: 'rotated' },
      ip: '127.0.0.2',
    });

    expect(second.previous_hash).toBe(first.entry_hash);
    expect(service.verifyTrail()).toEqual({
      valid: true,
      checked_entries: 2,
    });
  });

  it('filters entries by merchant', () => {
    service.recordEvent({
      merchant_id: 'merchant_a',
      event_type: 'auth.register',
      metadata: { channel: 'web' },
      ip: '127.0.0.1',
    });
    service.recordEvent({
      merchant_id: 'merchant_b',
      event_type: 'webhook.config_changed',
      metadata: { action: 'updated' },
      ip: '127.0.0.2',
    });

    expect(service.listEntries('merchant_b')).toHaveLength(1);
    expect(service.listEntries('merchant_b')[0]?.event_type).toBe('webhook.config_changed');
  });

  it('rejects unsupported audit events', () => {
    expect(() =>
      service.recordEvent({
        merchant_id: 'merchant_123',
        event_type: 'payment.failed' as never,
        metadata: {},
        ip: '127.0.0.1',
      }),
    ).toThrow(BadRequestException);
  });
});
