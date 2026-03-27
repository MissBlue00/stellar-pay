import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CheckoutSessionService } from './checkout-session.service';
import { CheckoutSessionEntity } from './entities/checkout-session.entity';

describe('CheckoutSessionService', () => {
  let service: CheckoutSessionService;
  let mockRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutSessionService,
        {
          provide: getRepositoryToken(CheckoutSessionEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CheckoutSessionService>(CheckoutSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new checkout session', async () => {
      const createDto = {
        merchant_id: 'merchant-123',
        payment_method: 'card',
        amount: 99.99,
        currency: 'USD',
        description: 'Test payment',
        merchant_name: 'Test Merchant',
      };

      const mockSession = {
        id: 'session-123',
        session_token: 'token-123',
        status: 'pending',
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        created_at: new Date(),
        ...createDto,
      };

      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.createSession(createDto);

      expect(result.session_token).toBeDefined();
      expect(result.status).toBe('pending');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('getSessionByToken', () => {
    it('should retrieve a session by token', async () => {
      const mockSession = {
        id: 'session-123',
        session_token: 'token-123',
        amount: 99.99,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        status: 'pending',
      };

      mockRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.getSessionByToken('token-123');

      expect(result).toEqual(mockSession);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { session_token: 'token-123' },
      });
    });

    it('should throw NotFoundException if session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getSessionByToken('invalid-token')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session expired', async () => {
      const mockSession = {
        id: 'session-123',
        session_token: 'token-123',
        expires_at: new Date(Date.now() - 1000),
        status: 'pending',
      };

      mockRepository.findOne.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue({
        ...mockSession,
        status: 'expired',
      });

      await expect(service.getSessionByToken('token-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'pending',
      };

      mockRepository.findOne.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue({
        ...mockSession,
        status: 'completed',
      });

      const result = await service.updateSessionStatus('session-123', 'completed');

      expect(result.status).toBe('completed');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('toResponseDto', () => {
    it('should convert entity to response DTO', async () => {
      const mockSession: CheckoutSessionEntity = {
        id: 'session-123',
        session_token: 'token-123',
        payment_method: 'card',
        amount: 99.99,
        currency: 'USD',
        description: 'Test',
        merchant_name: 'Test Merchant',
        return_url: 'http://localhost/return',
        status: 'pending',
        expires_at: new Date(),
        created_at: new Date(),
        merchant_id: 'merchant-123',
        webhook_url: null,
        metadata: null,
        updated_at: new Date(),
      };

      const result = await service.toResponseDto(mockSession);

      expect(result.id).toBe('session-123');
      expect(result.session_token).toBe('token-123');
      expect(result.amount).toBe(99.99);
    });
  });
});
