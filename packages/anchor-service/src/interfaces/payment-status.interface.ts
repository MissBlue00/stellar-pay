export interface PaymentStatusResponse {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  amount: string;
  assetCode: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}
