import { describe, it, expect } from 'vitest';
import { validateAmount, StellarService } from './stellar.service';

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
