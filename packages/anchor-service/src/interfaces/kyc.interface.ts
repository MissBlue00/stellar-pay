export interface KycStatusResponse {
  accountId: string;
  status: 'pending' | 'approved' | 'rejected';
  customerId?: string;
  message?: string;
  checkedAt: string;
}
