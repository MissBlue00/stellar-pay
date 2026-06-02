export interface RefundResult {
  transactionId: string;
  success: boolean;
  amountRefunded: number;
  totalAmount: number;
  isPartialRefund: boolean;
  status: 'refunded' | 'partially_refunded' | 'failed';
  error?: string;
  refundedAt: string;
}
