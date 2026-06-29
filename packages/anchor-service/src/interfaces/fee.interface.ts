export type TransactionType = 'deposit' | 'withdrawal' | 'send';

export interface FeeBreakdown {
  type: 'flat' | 'percentage';
  description: string;
  amount: string;
}

export interface FeeQuote {
  totalFee: string;
  asset: string;
  type: TransactionType;
  amount: string;
  feeBreakdown: FeeBreakdown[];
  effectiveRate: string;
  quoteId: string;
  expiresAt: string;
  createdAt: string;
}
