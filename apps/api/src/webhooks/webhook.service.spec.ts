import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'crypto';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from './webhook.repository';
import { WebhookEventType } from './interfaces/webhook-event.interface';
import type { WebhookConfig } from './interfaces/webhook-config.interface';

const mockConfig = (overrides: Partial<WebhookConfig> = {}): WebhookConfig => ({
  id: 'wh-1',
  merchant_id: 'merchant-1',
  url: 'https://example.com/webhook',
  secret: 'test-secret',
  events: [
    WebhookEventType.PAYMENT_CREATED,
    WebhookEventType.PAYMENT_DETECTED,
    WebhookEventType.PAYMENT_CONFIRMED,
    WebhookEventType.PAYMENT_FAILED,
  ],
  enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('WebhookService', () => {
  let service: WebhookService;
  let repo: WebhookRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookService, WebhookRepository],
    }).compile();

    service = module.get(WebhookService);
    repo = module.get(WebhookRepository);
  });

  describe('CRUD', () => {
    it('creates and retrieves a webhook config', () => {
      const config = service.createWebhook('merchant-1', {
        url: 'https://example.com/hook',
        events: [WebhookEventType.PAYMENT_CREATED],
      });

      expect(config.id).toBeDefined();
      expect(config.secret).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(service.getWebhook(config.id)).toEqual(config);
    });

    it('lists webhooks for a merchant', () => {
      service.createWebhook('merchant-1', {
        url: 'https://a.com',
        events: [WebhookEventType.PAYMENT_CREATED],
      });
      service.createWebhook('merchant-2', {
        url: 'https://b.com',
        events: [WebhookEventType.PAYMENT_FAILED],
      });

      expect(service.listWebhooks('merchant-1')).toHaveLength(1);
    });

    it('updates a webhook config', () => {
      const config = service.createWebhook('merchant-1', {
        url: 'https://old.com',
        events: [WebhookEventType.PAYMENT_CREATED],
      });

      const updated = service.updateWebhook(config.id, { url: 'https://new.com', enabled: false });
      expect(updated?.url).toBe('https://new.com');
      expect(updated?.enabled).toBe(false);
    });

    it('deletes a webhook config', () => {
      const config = service.createWebhook('merchant-1', {
        url: 'https://example.com',
        events: [WebhookEventType.PAYMENT_CREATED],
      });

      expect(service.deleteWebhook(config.id)).toBe(true);
      expect(service.getWebhook(config.id)).toBeUndefined();
    });
  });

  describe('dispatchEvent', () => {
    it('dispatches to matching active webhook configs', async () => {
      const config = mockConfig();
      jest.spyOn(repo, 'findActiveConfigsByEvent').mockReturnValue([config]);
      jest.spyOn(repo, 'saveDeliveryAttempt').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => 'ok',
      } as Response);

      await service.dispatchEvent('merchant-1', WebhookEventType.PAYMENT_CREATED, {
        payment_id: 'pay-1',
        amount: 100,
        currency: 'USDC',
        status: 'pending',
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(config.url);

      const body = JSON.parse(options.body as string) as {
        event: string;
        data: unknown;
        timestamp: string;
      };
      expect(body.event).toBe(WebhookEventType.PAYMENT_CREATED);
      expect(body.data).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });

    it('dispatches payment.detected event', async () => {
      const config = mockConfig({ events: [WebhookEventType.PAYMENT_DETECTED] });
      jest.spyOn(repo, 'findActiveConfigsByEvent').mockReturnValue([config]);
      jest.spyOn(repo, 'saveDeliveryAttempt').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response);

      await service.dispatchEvent('merchant-1', WebhookEventType.PAYMENT_DETECTED, {
        payment_id: 'pay-1',
      });

      const body = JSON.parse(
        ((global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as { event: string };
      expect(body.event).toBe('payment.detected');
    });

    it('dispatches payment.confirmed event', async () => {
      const config = mockConfig({ events: [WebhookEventType.PAYMENT_CONFIRMED] });
      jest.spyOn(repo, 'findActiveConfigsByEvent').mockReturnValue([config]);
      jest.spyOn(repo, 'saveDeliveryAttempt').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response);

      await service.dispatchEvent('merchant-1', WebhookEventType.PAYMENT_CONFIRMED, {
        payment_id: 'pay-1',
      });

      const body = JSON.parse(
        ((global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as { event: string };
      expect(body.event).toBe('payment.confirmed');
    });

    it('dispatches payment.failed event', async () => {
      const config = mockConfig({ events: [WebhookEventType.PAYMENT_FAILED] });
      jest.spyOn(repo, 'findActiveConfigsByEvent').mockReturnValue([config]);
      jest.spyOn(repo, 'saveDeliveryAttempt').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response);

      await service.dispatchEvent('merchant-1', WebhookEventType.PAYMENT_FAILED, {
        payment_id: 'pay-1',
      });

      const body = JSON.parse(
        ((global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit])[1].body as string,
      ) as { event: string };
      expect(body.event).toBe('payment.failed');
    });

    it('skips dispatch when no active configs match', async () => {
      jest.spyOn(repo, 'findActiveConfigsByEvent').mockReturnValue([]);
      global.fetch = jest.fn();

      await service.dispatchEvent('merchant-1', WebhookEventType.PAYMENT_CREATED, {});

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('includes HMAC signature header', async () => {
      const config = mockConfig();
      jest.spyOn(repo, 'findActiveConfigsByEvent').mockReturnValue([config]);
      jest.spyOn(repo, 'saveDeliveryAttempt').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response);

      await service.dispatchEvent('merchant-1', WebhookEventType.PAYMENT_CREATED, {
        payment_id: 'pay-1',
      });

      const headers = ((global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit])[1]
        .headers as Record<string, string>;
      expect(headers['X-Webhook-Signature']).toBeDefined();
      expect(headers['X-Webhook-Event']).toBe(WebhookEventType.PAYMENT_CREATED);
    });

    it('saves delivery attempt on success', async () => {
      const config = mockConfig();
      jest.spyOn(repo, 'findActiveConfigsByEvent').mockReturnValue([config]);
      const saveSpy = jest.spyOn(repo, 'saveDeliveryAttempt').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response);

      await service.dispatchEvent('merchant-1', WebhookEventType.PAYMENT_CREATED, {});

      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    it('saves failed delivery attempt on HTTP error', async () => {
      const config = mockConfig();
      jest.spyOn(repo, 'findActiveConfigsByEvent').mockReturnValue([config]);
      const saveSpy = jest.spyOn(repo, 'saveDeliveryAttempt').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => '',
      } as Response);

      await service.dispatchEvent('merchant-1', WebhookEventType.PAYMENT_CREATED, {});

      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
    });
  });

  describe('verifySignature', () => {
    it('returns true for a valid signature', () => {
      const payload = JSON.stringify({
        event: 'payment.created',
        data: {},
        timestamp: '2024-01-01T00:00:00.000Z',
      });
      const secret = 'my-secret';
      const sig = createHmac('sha256', secret).update(payload).digest('hex');

      expect(service.verifySignature(payload, sig, secret)).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      expect(service.verifySignature('payload', 'bad-sig', 'secret')).toBe(false);
    });
  });
});
