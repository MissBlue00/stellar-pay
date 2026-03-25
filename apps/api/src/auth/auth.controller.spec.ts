import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MerchantsService } from '../merchants/merchants.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Pick<AuthService, 'register' | 'login'>>;
  let merchantsService: jest.Mocked<Pick<MerchantsService, 'findById' | 'toPublicProfile'>>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };
    merchantsService = {
      findById: jest.fn(),
      toPublicProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: MerchantsService, useValue: merchantsService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('register delegates to AuthService', async () => {
    const dto = { email: 'a@b.com', password: 'password12', name: 'Shop' };
    const expected = {
      access_token: 't',
      expires_in: 100,
      merchant: { id: '1', email: 'a@b.com', name: 'Shop' },
    };
    authService.register.mockResolvedValue(expected);
    await expect(controller.register(dto)).resolves.toEqual(expected);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('me returns public profile when merchant exists', async () => {
    const record = {
      id: 'mid',
      email: 'm@x.com',
      passwordHash: 'h',
      name: 'M',
      createdAt: new Date(),
    };
    merchantsService.findById.mockResolvedValue(record);
    merchantsService.toPublicProfile.mockReturnValue({
      id: 'mid',
      email: 'm@x.com',
      name: 'M',
    });
    await expect(controller.me({ merchant_id: 'mid' })).resolves.toEqual({
      id: 'mid',
      email: 'm@x.com',
      name: 'M',
    });
  });
});
