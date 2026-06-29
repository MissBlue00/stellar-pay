import { StellarService } from './stellar.service';

const stellarService = new StellarService();

export async function sendStellarPayment(
  to: string,
  amount: number,
  asset: string,
): Promise<string> {
  return stellarService.sendFunds(to, amount.toString(), asset === 'XLM' ? undefined : asset);
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

export * from './stellar.service';
