import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Account, Horizon, TransactionBuilder, Networks } from 'stellar-sdk';
import { sendStellarPayment, createTransactionBuilder } from './index';

const mockSendFunds = vi.hoisted(() => vi.fn());
const mockCreateAssetPayment = vi.hoisted(() => vi.fn());

vi.mock('./stellar.service', () => {
  return {
    StellarService: function () {
      return { sendFunds: mockSendFunds, createAssetPayment: mockCreateAssetPayment };
    },
  };
});

describe('createTransactionBuilder', () => {
  it('creates a builder with testnet passphrase from server instance', () => {
    const source = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '1');
    const testnetPassphrase = Networks.TESTNET;
    const server = { networkPassphrase: testnetPassphrase } as unknown as Horizon.Server;

    const builder = createTransactionBuilder(source, server);
    
    expect(builder).toBeInstanceOf(TransactionBuilder);
    // @ts-ignore - accessing private field for verification
    expect(builder.networkPassphrase).toBe(testnetPassphrase);
  });

  it('creates a builder with public passphrase from server instance', () => {
    const source = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '1');
    const publicPassphrase = Networks.PUBLIC;
    const server = { networkPassphrase: publicPassphrase } as unknown as Horizon.Server;

    const builder = createTransactionBuilder(source, server);
    
    expect(builder).toBeInstanceOf(TransactionBuilder);
    // @ts-ignore - accessing private field for verification
    expect(builder.networkPassphrase).toBe(publicPassphrase);
  });
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

  const validParams = {
    destination: 'GDESTINATION123',
    amount: '100',
    assetCode: 'USDC',
    assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5ZG34M4666Z',
  };

  it('returns a PaymentResult on success', async () => {
    const expectedResult = {
      transactionHash: 'abc123txhash',
      assetCode: 'USDC',
      assetIssuer: validParams.assetIssuer,
      amount: '100',
      destination: 'GDESTINATION123',
    };
    mockCreateAssetPayment.mockResolvedValueOnce(expectedResult);
    const result = await createAssetPayment(validParams);
    expect(result).toEqual(expectedResult);
  });

  it('passes the params to stellarService.createAssetPayment', async () => {
    mockCreateAssetPayment.mockResolvedValueOnce({
      transactionHash: 'hash',
      assetCode: 'USDC',
      assetIssuer: validParams.assetIssuer,
      amount: '100',
      destination: 'GDESTINATION123',
    });
    await createAssetPayment(validParams);
    expect(mockCreateAssetPayment).toHaveBeenCalledWith(validParams);
  });

  it('throws when createAssetPayment fails', async () => {
    mockCreateAssetPayment.mockRejectedValueOnce(new Error('Trustline not found'));
    await expect(createAssetPayment(validParams)).rejects.toThrow('Trustline not found');
  });
});
