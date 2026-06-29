import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSendFunds = vi.hoisted(() => vi.fn());
const mockCreateAssetPayment = vi.hoisted(() => vi.fn());

vi.mock('./stellar.service', () => {
  return {
    StellarService: function () {
      return { sendFunds: mockSendFunds, createAssetPayment: mockCreateAssetPayment };
    },
  };
});

import { sendStellarPayment, createAssetPayment } from './index';

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

describe('createAssetPayment', () => {
  beforeEach(() => {
    mockCreateAssetPayment.mockReset();
  });

  it('returns a PaymentResult on success', async () => {
    const result = {
      transactionHash: 'txhash123',
      assetCode: 'USDC',
      assetIssuer: 'GBISSUER123',
      amount: '50',
      destination: 'GDEST123',
    };
    mockCreateAssetPayment.mockResolvedValueOnce(result);

    const payment = await createAssetPayment({
      destination: 'GDEST123',
      amount: '50',
      assetCode: 'USDC',
      assetIssuer: 'GBISSUER123',
    });

    expect(payment).toEqual(result);
  });

  it('passes params through to StellarService.createAssetPayment', async () => {
    const params = {
      destination: 'GDEST456',
      amount: '100',
      assetCode: 'EURT',
      assetIssuer: 'GASSURER789',
    };
    mockCreateAssetPayment.mockResolvedValueOnce({
      transactionHash: 'hash',
      ...params,
    });

    await createAssetPayment(params);
    expect(mockCreateAssetPayment).toHaveBeenCalledWith(params);
  });

  it('throws when createAssetPayment fails', async () => {
    mockCreateAssetPayment.mockRejectedValueOnce(new Error('Trustline not found'));
    await expect(
      createAssetPayment({
        destination: 'GDEST',
        amount: '10',
        assetCode: 'USDC',
        assetIssuer: 'GISS',
      }),
    ).rejects.toThrow('Trustline not found');
  });
});
