import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DepositAddressService } from './deposit-address.service';
import { WebhookService } from '../webhooks/webhook.service';
import { Currency } from './enums/currency.enum';

const mockWebhookService = () =>
  ({ dispatchEvent: jest.fn().mockResolvedValue(undefined) }) as unknown as jest.Mocked<WebhookService>;

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        DepositAddressService,
        { provide: WebhookService, useFactory: mockWebhookService },
      ],
    }).compile();

    controller = module.get(PaymentsController);
    paymentsService = module.get(PaymentsService);
  });

  describe('getPayment', () => {
    it('returns a payment when found and owned by merchant', () => {
      const payment = paymentsService.createPaymentIntent(
        { amount: 100, currency: Currency.USDC },
        'merchant-1',
      );
      const result = controller.getPayment(payment.id, { merchant_id: 'merchant-1' });
      expect(result.id).toBe(payment.id);
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('USDC');
    });

    it('throws NotFoundException when payment does not belong to merchant', () => {
      const payment = paymentsService.createPaymentIntent(
        { amount: 50, currency: Currency.EURC },
        'merchant-1',
      );
      expect(() =>
        controller.getPayment(payment.id, { merchant_id: 'merchant-2' }),
      ).toThrow(NotFoundException);
    });

    it('throws NotFoundException for unknown payment id', () => {
      expect(() =>
        controller.getPayment('no-such-id', { merchant_id: 'merchant-1' }),
      ).toThrow(NotFoundException);
    });

    it('returns all payment fields and timestamps', () => {
      const payment = paymentsService.createPaymentIntent(
        { amount: 200, currency: Currency.USDC, reference: 'ord-42', metadata: { key: 'val' } },
        'merchant-1',
      );
      const result = controller.getPayment(payment.id, { merchant_id: 'merchant-1' });

      expect(result).toMatchObject({
        id: payment.id,
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        merchantId: 'merchant-1',
        amount: 200,
        currency: 'USDC',
        reference: 'ord-42',
        metadata: { key: 'val' },
        status: 'pending',
      });
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
      expect(typeof result.expiresAt).toBe('string');
    });
  });
});
