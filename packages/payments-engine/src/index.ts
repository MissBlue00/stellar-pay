import { Account, Horizon, TransactionBuilder, BASE_FEE } from 'stellar-sdk';
import { StellarService } from './stellar.service';
import { StellarService, type AssetPaymentParams, type PaymentResult } from './stellar.service';

const stellarService = new StellarService();

/**
 * Creates and configures a Stellar TransactionBuilder with default settings.
 * 
 * @param source The source Account initiating the transaction.
 * @param server The Horizon server instance used to fetch network configuration.
 * @returns A configured TransactionBuilder ready for operations.
 */
export function createTransactionBuilder(source: Account, server: Horizon.Server): TransactionBuilder {
  // Grab it defensively depending on your exact SDK version structure
  const networkPassphrase = (server as any).networkPassphrase || '';

  return new TransactionBuilder(source, {
    fee: BASE_FEE, // FIX: Use the imported root BASE_FEE constant directly
    networkPassphrase,
  });
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
