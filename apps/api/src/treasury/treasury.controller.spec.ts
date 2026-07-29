import { Test, TestingModule } from '@nestjs/testing';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from './treasury.service';

describe('TreasuryController', () => {
  let controller: TreasuryController;
  let service: jest.Mocked<TreasuryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreasuryController],
      providers: [
        {
          provide: TreasuryService,
          useValue: {
            getTreasuryAssetBalances: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TreasuryController);
    service = module.get(TreasuryService);
  });

  it('returns treasury asset balances with available computed', async () => {
    const balances = [
      { symbol: 'USDC', totalMinted: 1000, totalReserved: 250, available: 750 },
      { symbol: 'XLM', totalMinted: 5000, totalReserved: 500, available: 4500 },
    ];

    service.getTreasuryAssetBalances.mockResolvedValue(balances as never);

    const result = await controller.getBalance();

    expect(service.getTreasuryAssetBalances).toHaveBeenCalled();
    expect(result).toEqual({ assets: balances });
  });
});
