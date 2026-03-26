import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CheckoutSessionController } from './checkout-session.controller';
import { CheckoutSessionService } from './checkout-session.service';

describe('CheckoutSessionController', () => {
  let controller: CheckoutSessionController;
  let service: CheckoutSessionService;

  beforeEach(async () => {
    const mockService = {
      getSessionByToken: jest.fn(),
      toResponseDto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutSessionController],
      providers: [
        {
          provide: CheckoutSessionService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CheckoutSessionController>(CheckoutSessionController);
    service = module.get<CheckoutSessionService>(CheckoutSessionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCheckoutSession', () => {
    it('should return checkout session by token', async () => {
      const mockSession = {
        id: 'session-123',
        session_token: 'token-123',
        amount: 99.99,
        currency: 'USD',
        description: 'Test',
        merchant_name: 'Test Merchant',
        status: 'pending',
        expires_at: new Date(),
        created_at: new Date(),
      };

      const mockResponse = {
        id: 'session-123',
        session_token: 'token-123',
        amount: 99.99,
        currency: 'USD',
        description: 'Test',
        merchant_name: 'Test Merchant',
        status: 'pending',
        expires_at: mockSession.expires_at,
        created_at: mockSession.created_at,
      };

      (service.getSessionByToken as jest.Mock).mockResolvedValue(mockSession);
      (service.toResponseDto as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.getCheckoutSession('token-123');

      expect(result).toEqual(mockResponse);
      expect(service.getSessionByToken).toHaveBeenCalledWith('token-123');
      expect(service.toResponseDto).toHaveBeenCalledWith(mockSession);
    });

    it('should throw BadRequestException for empty token', async () => {
      await expect(controller.getCheckoutSession('')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace token', async () => {
      await expect(controller.getCheckoutSession('   ')).rejects.toThrow(BadRequestException);
    });
  });
});
