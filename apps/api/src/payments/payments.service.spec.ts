import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { WebhookService } from '../webhooks/webhook.service';
import { WebhookEventType } from '../webhooks/interfaces/webhook-event.interface';
import { Currency } from './enums/currency.enum';

const mockWebhookService = (): jest.Mocked<WebhookService> =>
  ({
    dispatchEvent: jest.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<WebhookService>;

describe('PaymentsService – webhook event dispatch', () => {
  let service: PaymentsService;
  let webhookSvc: jest.Mocked<WebhookService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService, { provide: WebhookService, useFactory: mockWebhookService }],
    }).compile();

    service = module.get(PaymentsService);
    webhookSvc = module.get(WebhookService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── payment.created ──────────────────────────────────────────────────────

  describe('createPaymentIntent', () => {
    it('returns a payment with status "pending"', () => {
      const payment = service.createPaymentIntent(
        { amount: 50, currency: Currency.USDC },
        'merchant-1',
      );

      expect(payment.id).toBeDefined();
      expect(payment.status).toBe('pending');
      expect(payment.merchantId).toBe('merchant-1');
    });

    it('dispatches payment.created event with standardised payload', () => {
      const payment = service.createPaymentIntent(
        { amount: 100, currency: Currency.USDC, metadata: { ref: 'ord-9' } },
        'merchant-1',
      );

      expect(webhookSvc.dispatchEvent).toHaveBeenCalledTimes(1);
      expect(webhookSvc.dispatchEvent).toHaveBeenCalledWith(
        'merchant-1',
        WebhookEventType.PAYMENT_CREATED,
        expect.objectContaining({
          payment_id: payment.id,
          amount: 100,
          currency: 'USDC',
          status: 'pending',
        }),
      );
    });

    it('payload contains created_at timestamp', () => {
      service.createPaymentIntent({ amount: 1, currency: Currency.USDC }, 'merchant-1');

      const [, , data] = webhookSvc.dispatchEvent.mock.calls[0] as [
        string,
        WebhookEventType,
        Record<string, unknown>,
      ];
      expect(typeof data['created_at']).toBe('string');
    });
  });

  // ─── payment.detected ─────────────────────────────────────────────────────

  describe('markDetected', () => {
    it('updates status to "detected" and dispatches payment.detected', () => {
      const payment = service.createPaymentIntent(
        { amount: 10, currency: Currency.USDC },
        'merchant-2',
      );
      jest.clearAllMocks();

      const updated = service.markDetected(payment.id);
      expect(updated.status).toBe('detected');

      expect(webhookSvc.dispatchEvent).toHaveBeenCalledWith(
        'merchant-2',
        WebhookEventType.PAYMENT_DETECTED,
        expect.objectContaining({ payment_id: payment.id, status: 'detected' }),
      );
    });

    it('throws NotFoundException for an unknown payment id', () => {
      expect(() => service.markDetected('no-such-id')).toThrow(NotFoundException);
    });
  });

  // ─── payment.confirmed ────────────────────────────────────────────────────

  describe('markConfirmed', () => {
    it('updates status to "confirmed" and dispatches payment.confirmed', () => {
      const payment = service.createPaymentIntent(
        { amount: 25, currency: Currency.XLM },
        'merchant-3',
      );
      jest.clearAllMocks();

      const updated = service.markConfirmed(payment.id);
      expect(updated.status).toBe('confirmed');

      expect(webhookSvc.dispatchEvent).toHaveBeenCalledWith(
        'merchant-3',
        WebhookEventType.PAYMENT_CONFIRMED,
        expect.objectContaining({ payment_id: payment.id, status: 'confirmed' }),
      );
    });

    it('payload contains updated_at timestamp', () => {
      const payment = service.createPaymentIntent(
        { amount: 5, currency: Currency.USDC },
        'merchant-1',
      );
      jest.clearAllMocks();
      service.markConfirmed(payment.id);

      const [, , data] = webhookSvc.dispatchEvent.mock.calls[0] as [
        string,
        WebhookEventType,
        Record<string, unknown>,
      ];
      expect(typeof data['updated_at']).toBe('string');
    });

    it('throws NotFoundException for an unknown payment id', () => {
      expect(() => service.markConfirmed('no-such-id')).toThrow(NotFoundException);
    });
  });

  // ─── payment.failed ───────────────────────────────────────────────────────

  describe('markFailed', () => {
    it('updates status to "failed" and dispatches payment.failed', () => {
      const payment = service.createPaymentIntent(
        { amount: 75, currency: Currency.USDC },
        'merchant-4',
      );
      jest.clearAllMocks();

      const updated = service.markFailed(payment.id);
      expect(updated.status).toBe('failed');

      expect(webhookSvc.dispatchEvent).toHaveBeenCalledWith(
        'merchant-4',
        WebhookEventType.PAYMENT_FAILED,
        expect.objectContaining({ payment_id: payment.id, status: 'failed' }),
      );
    });

    it('throws NotFoundException for an unknown payment id', () => {
      expect(() => service.markFailed('no-such-id')).toThrow(NotFoundException);
    });
  });

  // ─── payload shape ────────────────────────────────────────────────────────

  describe('dispatch payload shape', () => {
    it('dispatches exactly once per lifecycle transition', () => {
      const payment = service.createPaymentIntent(
        { amount: 10, currency: Currency.USDC },
        'merchant-1',
      );
      jest.clearAllMocks();

      service.markDetected(payment.id);
      expect(webhookSvc.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    it('merchant id is forwarded correctly in every dispatch', () => {
      const merchantId = 'merchant-xyz';
      const payment = service.createPaymentIntent(
        { amount: 10, currency: Currency.USDC },
        merchantId,
      );

      const calls = webhookSvc.dispatchEvent.mock.calls as [string, ...unknown[]][];
      expect(calls[0][0]).toBe(merchantId);

      jest.clearAllMocks();
      service.markDetected(payment.id);
      service.markConfirmed(payment.id);
      service.markFailed(payment.id);

      const allCalls = webhookSvc.dispatchEvent.mock.calls as [string, ...unknown[]][];
      allCalls.forEach(([mid]) => expect(mid).toBe(merchantId));
    });
  });
});
