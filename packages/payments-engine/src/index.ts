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
export * from './stellar.service';
