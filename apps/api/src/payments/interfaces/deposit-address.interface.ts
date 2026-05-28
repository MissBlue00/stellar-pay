export enum DepositNetwork {
  STELLAR = 'STELLAR',
  BTC = 'BTC',
  ETH = 'ETH',
}

export interface DepositAddress {
  id: string;
  paymentId: string;
  network: DepositNetwork;
  address: string;
  memo?: string;
  derivationPath?: string;
  createdAt: string;
}
