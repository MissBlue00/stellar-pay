export interface DepositParams {
  anchorUrl: string;
  account: string;
  assetCode: string;
  memo?: string;
  memoType?: string;
  amount?: string;
  lang?: string;
  destinationExtra?: string;
  destinationExtraMemo?: string;
  onChangeCallback?: string;
  quoteId?: string;
}

export interface DepositResponse {
  success: boolean;
  transactionId?: string;
  interactiveUrl?: string;
  error?: string;
  amount?: string;
  assetCode?: string;
  status?: 'pending' | 'incomplete' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
