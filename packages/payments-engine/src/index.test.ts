import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSendFunds = vi.hoisted(() => vi.fn());

vi.mock('./stellar.service', () => {
  return {
    StellarService: function () {
      return { sendFunds: mockSendFunds };
    },
  };
});

import { sendStellarPayment } from './index';

describe('sendStellarPayment', () => {
  beforeEach(() => {
    mockSendFunds.mockReset();
  });

  it('returns a transaction hash on success', async () => {
    mockSendFunds.mockResolvedValueOnce('abc123txhash');
    const hash = await sendStellarPayment('GDESTINATION123', 10, 'XLM');
    expect(hash).toBe('abc123txhash');
  });

  it('passes XLM as native (undefined asset code)', async () => {
    mockSendFunds.mockResolvedValueOnce('hash-xlm');
    await sendStellarPayment('GDEST', 5, 'XLM');
    expect(mockSendFunds).toHaveBeenCalledWith('GDEST', '5', undefined);
  });

  it('passes non-XLM asset code through', async () => {
    mockSendFunds.mockResolvedValueOnce('hash-usdc');
    await sendStellarPayment('GDEST', 100, 'USDC');
    expect(mockSendFunds).toHaveBeenCalledWith('GDEST', '100', 'USDC');
  });

  it('throws when sendFunds fails', async () => {
    mockSendFunds.mockRejectedValueOnce(new Error('Network error'));
    await expect(sendStellarPayment('GDEST', 10, 'XLM')).rejects.toThrow('Network error');
  });
});
