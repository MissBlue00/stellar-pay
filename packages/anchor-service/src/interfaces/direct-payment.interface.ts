export interface Sep12KycData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
}

export interface DirectPaymentParams {
  senderId: string;
  receiverId: string;
  amount: string;
  assetCode: string;
  senderKyc: Sep12KycData;
  receiverKyc: Sep12KycData;
  originalTransactionRef: string;
  memo?: string;
}

export interface DirectPaymentResult {
  success: boolean;
  paymentId: string;
  stellarTransactionHash?: string;
  originalTransactionRef: string;
  amount: string;
  assetCode: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
}
