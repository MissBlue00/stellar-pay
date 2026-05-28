import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from '../database/payments.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsController & PaymentsService', () => {
  let controller: PaymentsController;
  let service: PaymentsService;
  let repository: PaymentsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [PaymentsService, PaymentsRepository],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
    repository = module.get<PaymentsRepository>(PaymentsRepository);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    const merchantUser = { merchant_id: 'merchant_98765' };
    const createDto: CreatePaymentDto = {
      amount: 150.75,
      currency: 'USD',
      destination: 'stellar:GDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      description: 'Test payment',
    };

    it('should successfully create a payment intent and return standard fields', async () => {
      const response = await controller.createPayment(merchantUser, createDto);

      expect(response).toHaveProperty('payment_id');
      expect(response).toHaveProperty('payment_reference');
      expect(response).toHaveProperty('checkout_url');

      expect(response.payment_id).toMatch(/^pay_/);
      expect(response.payment_reference).toMatch(/^ref_/);
      expect(response.checkout_url).toContain(response.payment_id);

      // Verify it was persisted in the repository
      const stored = await repository.findById(response.payment_id);
      expect(stored).toBeDefined();
      expect(stored?.merchant_id).toBe(merchantUser.merchant_id);
      expect(stored?.amount).toBe(createDto.amount);
      expect(stored?.currency).toBe(createDto.currency);
      expect(stored?.status).toBe('pending');
      expect(stored?.destination).toBe(createDto.destination);
      expect(stored?.description).toBe(createDto.description);
    });

    it('should throw BadRequestException if amount is negative or zero', async () => {
      const invalidDto = { ...createDto, amount: -10 };
      await expect(controller.createPayment(merchantUser, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if currency is empty', async () => {
      const invalidDto = { ...createDto, currency: '' };
      await expect(controller.createPayment(merchantUser, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
