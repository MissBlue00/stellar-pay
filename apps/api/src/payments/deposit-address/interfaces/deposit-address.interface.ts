import { Chain } from '../enums/chain.enum';

export interface DepositAddress {
  id: string;
  paymentIntentId: string;
  chain: Chain;
  address: string;
  memo?: string;
  derivationIndex: number;
  expiresAt?: string;
  createdAt: string;
}
