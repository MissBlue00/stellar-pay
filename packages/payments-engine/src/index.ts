import { randomBytes } from 'crypto';
import { StellarService, type AssetPaymentParams, type PaymentResult } from './stellar.service';

const stellarService = new StellarService();
const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function encodeBase62(bytes: Uint8Array): string {
  let value = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
  const base = 62n;
  let encoded = '';

  if (value === 0n) {
    return '0';
  }

  while (value > 0n) {
    const remainder = Number(value % base);
    encoded = BASE62_ALPHABET[remainder] + encoded;
    value = value / base;
  }

  return encoded;
}

export function generatePaymentId(prefix = 'pay'): string {
  const normalizedPrefix =
    (prefix ?? 'pay')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '') || 'pay';
  const timestamp = Date.now().toString(36);
  const randomPart = encodeBase62(randomBytes(4));

  return `${normalizedPrefix}_${timestamp}${randomPart}`;
}

export async function sendStellarPayment(
  to: string,
  amount: number,
  asset: string,
): Promise<string> {
  return stellarService.sendFunds(to, amount.toString(), asset === 'XLM' ? undefined : asset);
}

export async function createAssetPayment(params: AssetPaymentParams): Promise<PaymentResult> {
  return stellarService.createAssetPayment(params);
}

export type {
  PaymentMemoType,
  PaymentAssetInput,
  PaymentMemoInput,
  SourceAccountInput,
  BuildTransactionParamsInput,
  BuiltTransactionParams,
} from './build-transaction-params';

export {
  buildTransactionParams,
  buildTransactionFromParams,
  encodePaymentMemo,
} from './build-transaction-params';

export type {
  Horizon,
  PaymentChannelStatus,
  PaymentChannelAsset,
  PaymentChannelDistribution,
  PaymentChannelSigner,
  PaymentChannel,
  PaymentChannelConfig,
  ChannelCloseResult,
} from './payment-channel';

export {
  buildChannelCloseTransaction,
  closePaymentChannel,
  createPaymentChannel,
} from './payment-channel';

export { buildSignedTransaction } from './transaction';

export * from './stellar.service';
