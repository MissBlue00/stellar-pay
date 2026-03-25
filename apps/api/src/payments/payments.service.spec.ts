import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, PaymentAsset } from './dto/create-payment-intent.dto';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              const config = {
                SUPPORTED_ASSETS: 'USDC,ARS',
                CHECKOUT_URL_DOMAIN: 'https://checkout.stellar-pay.local',
              };
              return config[key as keyof typeof config] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    const merchantId = 'merchant_123';
    const validDto: CreatePaymentIntentDto = {
      amount: 100,
      asset: PaymentAsset.USDC,
      description: 'Test payment',
    };

    it('should create a payment intent with valid data', async () => {
      const result = await service.createPaymentIntent(merchantId, validDto);

      expect(result).toBeDefined();
      expect(result.payment_id).toBeDefined();
      expect(result.payment_reference).toBeDefined();
      expect(result.checkout_url).toBeDefined();
      expect(result.amount).toBe(validDto.amount);
      expect(result.asset).toBe(validDto.asset);
      expect(result.status).toBe('pending');
      expect(result.merchant_id).toBe(merchantId);
    });

    it('should generate unique payment references', async () => {
      const result1 = await service.createPaymentIntent(merchantId, validDto);
      const result2 = await service.createPaymentIntent(merchantId, validDto);

      expect(result1.payment_reference).not.toBe(result2.payment_reference);
      expect(result1.payment_id).not.toBe(result2.payment_id);
    });

    it('should throw BadRequestException for unsupported asset', async () => {
      const invalidDto = {
        ...validDto,
        asset: 'INVALID_ASSET' as PaymentAsset,
      };

      await expect(service.createPaymentIntent(merchantId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for negative amount', async () => {
      const invalidDto = {
        ...validDto,
        amount: -100,
      };

      await expect(service.createPaymentIntent(merchantId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for zero amount', async () => {
      const invalidDto = {
        ...validDto,
        amount: 0,
      };

      await expect(service.createPaymentIntent(merchantId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate checkout URL with payment ID and reference', async () => {
      const result = await service.createPaymentIntent(merchantId, validDto);

      expect(result.checkout_url).toContain(result.payment_id);
      expect(result.checkout_url).toContain(result.payment_reference);
      expect(result.checkout_url).toContain('https://checkout.stellar-pay.local');
    });
  });

  describe('getPaymentIntent', () => {
    const merchantId = 'merchant_123';
    const validDto: CreatePaymentIntentDto = {
      amount: 100,
      asset: PaymentAsset.USDC,
    };

    it('should return payment intent for authorized merchant', async () => {
      const created = await service.createPaymentIntent(merchantId, validDto);
      const retrieved = await service.getPaymentIntent(created.payment_id, merchantId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.payment_id).toBe(created.payment_id);
      expect(retrieved?.merchant_id).toBe(merchantId);
    });

    it('should return null for non-existent payment intent', async () => {
      const result = await service.getPaymentIntent('non-existent-id', merchantId);
      expect(result).toBeNull();
    });

    it('should throw unauthorized error for different merchant', async () => {
      const created = await service.createPaymentIntent(merchantId, validDto);

      await expect(
        service.getPaymentIntent(created.payment_id, 'different_merchant'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMerchantPaymentIntents', () => {
    const merchantId = 'merchant_123';
    const otherMerchantId = 'merchant_456';
    const validDto: CreatePaymentIntentDto = {
      amount: 100,
      asset: PaymentAsset.USDC,
    };

    it('should return all payment intents for merchant', async () => {
      await service.createPaymentIntent(merchantId, validDto);
      await service.createPaymentIntent(merchantId, validDto);
      await service.createPaymentIntent(otherMerchantId, validDto);

      const intents = await service.getMerchantPaymentIntents(merchantId);

      expect(intents).toHaveLength(2);
      expect(intents.every((i) => i.merchant_id === merchantId)).toBe(true);
    });

    it('should return empty array for merchant with no intents', async () => {
      const intents = await service.getMerchantPaymentIntents('unknown_merchant');
      expect(intents).toEqual([]);
    });
  });
});
