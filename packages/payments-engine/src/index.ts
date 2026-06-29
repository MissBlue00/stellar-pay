import { StellarService } from './stellar.service';
import type { AssetPaymentParams, PaymentResult } from './stellar.service';

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

export * from './stellar.service';
