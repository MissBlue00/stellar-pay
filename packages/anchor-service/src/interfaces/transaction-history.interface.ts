import type {
  AnchorTransaction,
  AnchorTransactionStatus,
  AnchorTransactionType,
} from './transaction.interface';

export interface HistoryParams {
  anchorUrl: string;
  account?: string;
  asset?: string;
  type?: AnchorTransactionType;
  status?: AnchorTransactionStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  limit?: number;
  cursor?: string;
  order?: 'asc' | 'desc';
}

export interface TransactionHistoryResult {
  transactions: AnchorTransaction[];
  nextCursor?: string;
  limit: number;
  total?: number;
}
