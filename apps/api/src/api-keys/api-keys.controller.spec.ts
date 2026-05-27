import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysController', () => {
  it('creates an API key for the current merchant', async () => {
    const createApiKey = jest.fn().mockResolvedValue({ key: 'sp_live_test' });
    const controller = new ApiKeysController({
      createApiKey,
    } as unknown as ApiKeysService);

    await expect(controller.createApiKey({ merchant_id: 'merchant_123' })).resolves.toEqual({
      key: 'sp_live_test',
    });
    expect(createApiKey).toHaveBeenCalledWith('merchant_123');
  });
});
