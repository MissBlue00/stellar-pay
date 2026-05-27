import { createHash } from 'node:crypto';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from './prisma.service';

describe('ApiKeysService', () => {
  const merchantId = 'merchant_123';

  it('generates a live API key and stores only its SHA256 hash', async () => {
    const executeRaw = jest.fn().mockResolvedValue(1);
    const service = new ApiKeysService({
      $executeRaw: executeRaw,
    } as unknown as PrismaService);

    const result = await service.createApiKey(merchantId);

    expect(result.key).toMatch(/^sp_live_[a-f0-9]{64}$/);
    expect(executeRaw).toHaveBeenCalledTimes(1);

    const [, storedId, storedMerchantId, storedHash, createdAt, updatedAt] =
      executeRaw.mock.calls[0];
    const expectedHash = createHash('sha256').update(result.key).digest('hex');

    expect(typeof storedId).toBe('string');
    expect(storedMerchantId).toBe(merchantId);
    expect(storedHash).toBe(expectedHash);
    expect(storedHash).not.toBe(result.key);
    expect(createdAt).toBeInstanceOf(Date);
    expect(updatedAt).toBeInstanceOf(Date);
  });

  it('generates a unique plaintext key for each request', async () => {
    const service = new ApiKeysService({
      $executeRaw: jest.fn().mockResolvedValue(1),
    } as unknown as PrismaService);

    const first = await service.createApiKey(merchantId);
    const second = await service.createApiKey(merchantId);

    expect(first.key).not.toBe(second.key);
  });
});
