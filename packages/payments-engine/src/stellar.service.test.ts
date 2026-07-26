import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as StellarSdk from 'stellar-sdk';
import { StellarService, type SubmitResult, validateAmount } from './stellar.service';

describe('validateAmount', () => {
  const stellarService = new StellarService();

  it('validates a correct positive amount within Stellar precision', () => {
    const result = validateAmount('10.5');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();

    const serviceResult = stellarService.validateAmount('10.5');
    expect(serviceResult.valid).toBe(true);
  });

  it('validates amount at the maximum allowed decimal precision (7 decimals)', () => {
    const result = validateAmount('0.1234567');
    expect(result.valid).toBe(true);
  });

  it('rejects amount exceeding 7 decimal places', () => {
    const result = validateAmount('0.12345678');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('7 decimal places');
  });

  it('rejects zero or negative amounts', () => {
    const zeroResult = validateAmount('0');
    expect(zeroResult.valid).toBe(false);
    expect(zeroResult.error).toBe('Amount must be a positive number');

    const negResult = validateAmount('-5');
    expect(negResult.valid).toBe(false);
    expect(negResult.error).toBe('Invalid amount format');
  });

  it('rejects non-numeric or empty string formats', () => {
    expect(validateAmount('').valid).toBe(false);
    expect(validateAmount('   ').valid).toBe(false);
    expect(validateAmount('abc').valid).toBe(false);
    expect(validateAmount('10.5.2').valid).toBe(false);
  });

  it('checks asset-specific minimum limits (e.g. XLM minimum 0.00001)', () => {
    const belowMinXlm = validateAmount('0.000005', 'XLM');
    expect(belowMinXlm.valid).toBe(false);
    expect(belowMinXlm.error).toContain('below the minimum required amount of 0.00001 for XLM');

    const exactMinXlm = validateAmount('0.00001', 'XLM');
    expect(exactMinXlm.valid).toBe(true);

    const belowMinUsdc = validateAmount('0.000001', 'USDC');
    expect(belowMinUsdc.valid).toBe(false);
    expect(belowMinUsdc.error).toContain('below the minimum required amount');
  });
});

describe('StellarService.submitTransaction', () => {
  const mockServer = {
    submitTransaction: vi.fn(),
  };

  let service: StellarService;
  let transaction: StellarSdk.Transaction;

  beforeEach(() => {
    mockServer.submitTransaction.mockReset();

    service = new StellarService();
    (service as any).server = mockServer;

    const sourceKeypair = StellarSdk.Keypair.random();
    const sourceAccount = new StellarSdk.Account(sourceKeypair.publicKey(), '1');
    transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: sourceKeypair.publicKey(),
          asset: StellarSdk.Asset.native(),
          amount: '1',
        }),
      )
      .setTimeout(30)
      .build();
    transaction.sign(sourceKeypair);
  });

  it('returns a successful result on first submit', async () => {
    const expected: SubmitResult = {
      hash: 'abc123',
      successful: true,
      ledger: 123,
      envelopeXdr: 'envxdr',
    };
    mockServer.submitTransaction.mockResolvedValueOnce(expected);

    const result = await service.submitTransaction(transaction);

    expect(result).toEqual(expected);
    expect(mockServer.submitTransaction).toHaveBeenCalledTimes(1);
  });

  it('retries once on timeout error and returns the second result', async () => {
    const timeoutError = new Error('timeout waiting for response');
    const expected: SubmitResult = {
      hash: 'retry-hash',
      successful: true,
      ledger: 456,
      envelopeXdr: 'envxdr2',
    };

    mockServer.submitTransaction.mockRejectedValueOnce(timeoutError);
    mockServer.submitTransaction.mockResolvedValueOnce(expected);

    const result = await service.submitTransaction(transaction);

    expect(result).toEqual(expected);
    expect(mockServer.submitTransaction).toHaveBeenCalledTimes(2);
  });

  it('returns a failed result without retry for non-timeout errors', async () => {
    const errorMessage = 'bad request';
    mockServer.submitTransaction.mockRejectedValueOnce(new Error(errorMessage));

    const result = await service.submitTransaction(transaction);

    expect(result.successful).toBe(false);
    expect(result.error).toContain(errorMessage);
    expect(result.hash).toBe(transaction.hash().toString('hex'));
    expect(result.ledger).toBeNull();
    expect(result.envelopeXdr).toBe(transaction.toEnvelope().toXDR('base64'));
    expect(mockServer.submitTransaction).toHaveBeenCalledTimes(1);
  });
});
