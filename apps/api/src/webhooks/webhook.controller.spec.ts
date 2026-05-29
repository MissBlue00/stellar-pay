import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookEventType } from './interfaces/webhook-event.interface';
import type { WebhookConfig } from './interfaces/webhook-config.interface';
import type { CreateWebhookDto } from './dto/create-webhook.dto';
import type { UpdateWebhookDto } from './dto/update-webhook.dto';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';

const MERCHANT_ID = 'merchant-test-1';
const OTHER_MERCHANT_ID = 'merchant-other';

const merchant = (): MerchantUser => ({ merchant_id: MERCHANT_ID }) as MerchantUser;

const makeConfig = (overrides: Partial<WebhookConfig> = {}): WebhookConfig => ({
  id: 'wh-abc',
  merchant_id: MERCHANT_ID,
  url: 'https://example.com/hook',
  secret: 'secret-xyz',
  events: [WebhookEventType.PAYMENT_CREATED, WebhookEventType.PAYMENT_CONFIRMED],
  enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const mockService = (): jest.Mocked<WebhookService> =>
  ({
    createWebhook: jest.fn(),
    listWebhooks: jest.fn(),
    getWebhook: jest.fn(),
    updateWebhook: jest.fn(),
    deleteWebhook: jest.fn(),
    getDeliveryAttempts: jest.fn(),
    dispatchEvent: jest.fn(),
  }) as unknown as jest.Mocked<WebhookService>;

describe('WebhookController', () => {
  let controller: WebhookController;
  let svc: jest.Mocked<WebhookService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [{ provide: WebhookService, useFactory: mockService }],
    }).compile();

    controller = module.get(WebhookController);
    svc = module.get(WebhookService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── POST /webhooks ────────────────────────────────────────────────────────

  describe('create', () => {
    it('delegates to WebhookService.createWebhook and returns config', () => {
      const config = makeConfig();
      svc.createWebhook.mockReturnValue(config);

      const dto: CreateWebhookDto = {
        url: 'https://example.com/hook',
        events: [WebhookEventType.PAYMENT_CREATED],
      };

      const result = controller.create(dto, merchant());
      expect(svc.createWebhook).toHaveBeenCalledWith(MERCHANT_ID, dto);
      expect(result).toEqual(config);
    });
  });

  // ─── GET /webhooks ─────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns all webhooks for the authenticated merchant', () => {
      const configs = [makeConfig(), makeConfig({ id: 'wh-2' })];
      svc.listWebhooks.mockReturnValue(configs);

      const result = controller.list(merchant());
      expect(svc.listWebhooks).toHaveBeenCalledWith(MERCHANT_ID);
      expect(result).toEqual(configs);
    });
  });

  // ─── GET /webhooks/:id ─────────────────────────────────────────────────────

  describe('get', () => {
    it('returns webhook when it belongs to the merchant', () => {
      const config = makeConfig();
      svc.getWebhook.mockReturnValue(config);

      expect(controller.get('wh-abc', merchant())).toEqual(config);
    });

    it('throws NotFoundException when webhook does not exist', () => {
      svc.getWebhook.mockReturnValue(undefined);
      expect(() => controller.get('missing', merchant())).toThrow(NotFoundException);
    });

    it('throws ForbiddenException when webhook belongs to another merchant', () => {
      svc.getWebhook.mockReturnValue(makeConfig({ merchant_id: OTHER_MERCHANT_ID }));
      expect(() => controller.get('wh-abc', merchant())).toThrow(ForbiddenException);
    });
  });

  // ─── PATCH /webhooks/:id ───────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the modified webhook', () => {
      const updated = makeConfig({ url: 'https://new.com', enabled: false });
      svc.getWebhook.mockReturnValue(makeConfig());
      svc.updateWebhook.mockReturnValue(updated);

      const result = controller.update(
        'wh-abc',
        { url: 'https://new.com', enabled: false } as UpdateWebhookDto,
        merchant(),
      );
      expect(svc.updateWebhook).toHaveBeenCalledWith('wh-abc', {
        url: 'https://new.com',
        enabled: false,
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when webhook does not exist', () => {
      svc.getWebhook.mockReturnValue(undefined);
      expect(() => controller.update('missing', {} as UpdateWebhookDto, merchant())).toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when webhook belongs to another merchant', () => {
      svc.getWebhook.mockReturnValue(makeConfig({ merchant_id: OTHER_MERCHANT_ID }));
      expect(() => controller.update('wh-abc', {} as UpdateWebhookDto, merchant())).toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── DELETE /webhooks/:id ──────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the webhook without returning content', () => {
      svc.getWebhook.mockReturnValue(makeConfig());
      svc.deleteWebhook.mockReturnValue(true);

      expect(() => controller.delete('wh-abc', merchant())).not.toThrow();
      expect(svc.deleteWebhook).toHaveBeenCalledWith('wh-abc');
    });

    it('throws NotFoundException when webhook does not exist', () => {
      svc.getWebhook.mockReturnValue(undefined);
      expect(() => controller.delete('missing', merchant())).toThrow(NotFoundException);
    });

    it('throws ForbiddenException when webhook belongs to another merchant', () => {
      svc.getWebhook.mockReturnValue(makeConfig({ merchant_id: OTHER_MERCHANT_ID }));
      expect(() => controller.delete('wh-abc', merchant())).toThrow(ForbiddenException);
    });
  });

  // ─── GET /webhooks/:id/deliveries ─────────────────────────────────────────

  describe('getDeliveries', () => {
    it('returns delivery attempts for a webhook belonging to the merchant', () => {
      svc.getWebhook.mockReturnValue(makeConfig());
      svc.getDeliveryAttempts.mockReturnValue([]);

      const result = controller.getDeliveries('wh-abc', merchant());
      expect(svc.getDeliveryAttempts).toHaveBeenCalledWith('wh-abc');
      expect(result).toEqual([]);
    });

    it('throws NotFoundException when webhook does not exist', () => {
      svc.getWebhook.mockReturnValue(undefined);
      expect(() => controller.getDeliveries('missing', merchant())).toThrow(NotFoundException);
    });

    it('throws ForbiddenException when webhook belongs to another merchant', () => {
      svc.getWebhook.mockReturnValue(makeConfig({ merchant_id: OTHER_MERCHANT_ID }));
      expect(() => controller.getDeliveries('wh-abc', merchant())).toThrow(ForbiddenException);
    });
  });
});
