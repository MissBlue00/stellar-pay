jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { LoginMerchantDto } from './dto/login-merchant.dto';

const mockAuthService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: ReturnType<typeof mockAuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validDto: RegisterMerchantDto = {
      email: 'merchant@test.com',
      password: 'strongPass123',
      name: 'Test Merchant',
    };

    it('should return merchant_id and email on successful registration', async () => {
      const expected = { merchant_id: 'merchant-uuid', email: validDto.email };
      authService.register.mockResolvedValue(expected);

      const result = await controller.register(validDto);

      expect(result).toEqual(expected);
      expect(authService.register).toHaveBeenCalledWith(validDto);
    });

    it('should throw BadRequestException when email is already taken', async () => {
      authService.register.mockRejectedValue(new BadRequestException('Email already in use'));

      await expect(controller.register(validDto)).rejects.toThrow(BadRequestException);
      expect(authService.register).toHaveBeenCalledWith(validDto);
    });

    it('should throw BadRequestException for invalid dto (delegated to service)', async () => {
      const invalidDto = { email: 'not-an-email', password: 'short' } as RegisterMerchantDto;
      authService.register.mockRejectedValue(new BadRequestException('Validation failed'));

      await expect(controller.register(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /auth/login', () => {
    const loginDto: LoginMerchantDto = {
      email: 'merchant@test.com',
      password: 'correct-password',
    };

    it('should return access token with correct credentials', async () => {
      const expected = { access_token: 'jwt-token', expires_in: 3600 };
      authService.login.mockResolvedValue(expected);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expected);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException with incorrect password', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      const unknownDto: LoginMerchantDto = {
        email: 'unknown@test.com',
        password: 'some-password',
      };
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(unknownDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POST /auth/logout', () => {
    it('should call authService.logout with the bearer token', () => {
      const req = { headers: { authorization: 'Bearer test-token' } } as Request;

      controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith('Bearer test-token');
    });

    it('should throw UnauthorizedException when no authorization header', () => {
      const req = { headers: {} } as Request;
      authService.logout.mockImplementation(() => {
        throw new UnauthorizedException('No token provided');
      });

      expect(() => controller.logout(req)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when authService rejects invalid token', () => {
      const req = {
        headers: { authorization: 'Bearer invalid-token' },
      } as Request;
      authService.logout.mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });

      expect(() => controller.logout(req)).toThrow(UnauthorizedException);
    });
  });
});
