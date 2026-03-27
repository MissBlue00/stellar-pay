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
