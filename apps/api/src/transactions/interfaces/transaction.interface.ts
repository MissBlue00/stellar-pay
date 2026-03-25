export enum TransactionNetwork {
  STELLAR = 'STELLAR',
  BTC = 'BTC',
  ETH = 'ETH',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export const CONFIRMATION_THRESHOLDS: Record<TransactionNetwork, number> = {
  [TransactionNetwork.STELLAR]: 1,
  [TransactionNetwork.BTC]: 3,
  [TransactionNetwork.ETH]: 12,
};

export interface Transaction {
  id: string;
  network: TransactionNetwork;
  hash: string;
  status: TransactionStatus;
  confirmations: number;
  required_confirmations: number;
  created_at: string;
  confirmed_at?: string;
}
