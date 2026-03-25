import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { MerchantsModule } from '../merchants/merchants.module';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MerchantsModule,
        JwtModule.register({
          secret: 'unit-test-secret',
          signOptions: { expiresIn: 3600 },
        }),
      ],
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a merchant and returns a JWT-shaped response', async () => {
    const res = await service.register({
      email: 'merchant@example.com',
      password: 'password12',
      name: 'Test Shop',
    });
    expect(res.access_token).toBeDefined();
    expect(res.expires_in).toBeGreaterThan(0);
    expect(res.merchant.email).toBe('merchant@example.com');
    expect(res.merchant.name).toBe('Test Shop');
  });

  it('rejects duplicate registration email', async () => {
    await service.register({
      email: 'dup@example.com',
      password: 'password12',
      name: 'A',
    });
    await expect(
      service.register({
        email: 'dup@example.com',
        password: 'otherpass1',
        name: 'B',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with correct credentials', async () => {
    await service.register({
      email: 'login@example.com',
      password: 'password12',
      name: 'Login Co',
    });
    const res = await service.login({
      email: 'login@example.com',
      password: 'password12',
    });
    expect(res.access_token).toBeDefined();
    expect(res.merchant.name).toBe('Login Co');
  });

  it('rejects login with wrong password', async () => {
    await service.register({
      email: 'bad@example.com',
      password: 'password12',
      name: 'X',
    });
    await expect(
      service.login({ email: 'bad@example.com', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
