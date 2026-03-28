export enum RedemptionStatus {
  PENDING = 'pending',
  BURNING = 'burning',
  WITHDRAWAL_QUEUED = 'withdrawal_queued',
  FAILED = 'failed',
}

export class RedeemDto {
  /** Mirror asset code to burn (e.g. "USDC", "ARS") */
  asset_code!: string;
  /** Amount of mirror asset to redeem */
  amount!: string;
  /** Merchant's Stellar address that holds the mirror assets */
  merchant_wallet!: string;
  /** Address to receive the underlying base currency */
  destination_address!: string;
}

export interface WithdrawalJob {
  withdrawal_id: string;
  merchant_id: string;
  asset_code: string;
  amount: string;
  destination_address: string;
  burn_transaction_hash: string;
  queued_at: string;
}

export interface RedeemResponse {
  redemption_id: string;
  merchant_id: string;
  asset_code: string;
  amount: string;
  status: RedemptionStatus;
  burn_transaction_hash: string;
  withdrawal_id: string;
  created_at: string;
}
