export interface PaymentIntentType {
  id: string;
  amount: number;
  currency: string;
  assetCode?: string;
  assetIssuer?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
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
