import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, PaymentAsset } from './dto/create-payment-intent.dto';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentIntentResponse = {
    payment_id: 'test-id-123',
    payment_reference: 'PYMT-MERCH-1234567890-ABC123',
    checkout_url: 'https://checkout.stellar-pay.local/pay/test-id-123/PYMT-MERCH-1234567890-ABC123',
    amount: 100,
    asset: 'USDC',
    status: 'pending',
    created_at: new Date(),
    merchant_id: 'merchant_123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            createPaymentIntent: jest.fn().mockResolvedValue(mockPaymentIntentResponse),
            getPaymentIntent: jest.fn().mockResolvedValue(mockPaymentIntentResponse),
            getMerchantPaymentIntents: jest.fn().mockResolvedValue([mockPaymentIntentResponse]),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const merchant: MerchantUser = { merchant_id: 'merchant_123' };
      const dto: CreatePaymentIntentDto = {
        amount: 100,
        asset: PaymentAsset.USDC,
        description: 'Test payment',
      };

      const result = await controller.createPaymentIntent(merchant, dto);

      expect(result).toEqual(mockPaymentIntentResponse);
      expect(service.createPaymentIntent).toHaveBeenCalledWith(merchant.merchant_id, dto);
    });

    it('should throw BadRequestException when merchant_id is missing', async () => {
      const merchant: MerchantUser = { merchant_id: null } as unknown as MerchantUser;
      const dto: CreatePaymentIntentDto = {
        amount: 100,
        asset: PaymentAsset.USDC,
      };

      await expect(controller.createPaymentIntent(merchant, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when merchant is undefined', async () => {
      const dto: CreatePaymentIntentDto = {
        amount: 100,
        asset: PaymentAsset.USDC,
      };

      await expect(
        controller.createPaymentIntent(undefined as unknown as MerchantUser, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPaymentIntent', () => {
    it('should return a payment intent', async () => {
      const merchant: MerchantUser = { merchant_id: 'merchant_123' };
      const paymentId = 'test-id-123';

      const result = await controller.getPaymentIntent(merchant, paymentId);

      expect(result).toEqual(mockPaymentIntentResponse);
      expect(service.getPaymentIntent).toHaveBeenCalledWith(paymentId, merchant.merchant_id);
    });

    it('should throw NotFoundException when payment intent not found', async () => {
      const merchant: MerchantUser = { merchant_id: 'merchant_123' };
      const paymentId = 'non-existent-id';

      jest.spyOn(service, 'getPaymentIntent').mockResolvedValueOnce(null);

      await expect(controller.getPaymentIntent(merchant, paymentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when merchant_id is missing', async () => {
      const merchant: MerchantUser = { merchant_id: null } as unknown as MerchantUser;

      await expect(controller.getPaymentIntent(merchant, 'test-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMerchantPaymentIntents', () => {
    it('should return merchant payment intents', async () => {
      const merchant: MerchantUser = { merchant_id: 'merchant_123' };

      const result = await controller.getMerchantPaymentIntents(merchant);

      expect(result).toEqual([mockPaymentIntentResponse]);
      expect(service.getMerchantPaymentIntents).toHaveBeenCalledWith(merchant.merchant_id);
    });

    it('should throw BadRequestException when merchant_id is missing', async () => {
      const merchant: MerchantUser = { merchant_id: null } as unknown as MerchantUser;

      await expect(controller.getMerchantPaymentIntents(merchant)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
