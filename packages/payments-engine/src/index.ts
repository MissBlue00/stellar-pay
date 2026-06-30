import { StellarService, type AssetPaymentParams, type PaymentResult } from './stellar.service';

const stellarService = new StellarService();

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
