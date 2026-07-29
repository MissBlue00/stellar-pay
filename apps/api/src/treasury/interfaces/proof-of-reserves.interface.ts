export interface AssetReserve {
  symbol: string;
  total_supply: string;
  treasury_balance: string;
  reserve_ratio: number;
}

export interface ProofOfReservesResponse {
  timestamp: string;
  network: string;
  reserves: AssetReserve[];
}

export interface TreasuryAssetBalance {
  symbol: string;
  totalMinted: number;
  totalReserved: number;
  available: number;
}

export interface TreasuryBalanceResponse {
  assets: TreasuryAssetBalance[];
}

export interface RedeemResponse {
  redemption_id: string;
  amount: number;
  currency: string;
  destination: string;
  status: string;
  burn_tx_hash: string | null;
  created_at: string;
}
