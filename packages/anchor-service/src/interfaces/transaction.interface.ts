export type AnchorTransactionType = 'deposit' | 'withdrawal';
export type AnchorTransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface AnchorTransaction {
  id: string;
  type: AnchorTransactionType;
  amount: number;
  amountRefunded: number;
  status: AnchorTransactionStatus;
  asset: string;
  sourceAddress: string;
  destinationAddress: string;
  memo?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
