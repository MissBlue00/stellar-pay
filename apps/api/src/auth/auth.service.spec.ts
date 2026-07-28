jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { merchant: { findUnique: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    prisma = {
      merchant: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = {
      sign: jest.fn(),
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  it('blacklists a token so it can be recognized as invalidated', () => {
    service.logout('Bearer test-token');

    expect(service.isTokenBlacklisted('test-token')).toBe(true);
  });
});
