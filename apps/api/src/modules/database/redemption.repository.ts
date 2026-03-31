import { Injectable } from '@nestjs/common';

export type RedemptionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Redemption {
  id: string;
  status: RedemptionStatus;
  destinationAddress: string;
  amount: string;
  txHash?: string;
  errorMessage?: string;
  completedAt?: Date;
}

@Injectable()
export class RedemptionRepository {
  // Mock in-memory database
  private redemptions: Redemption[] = [
    {
      id: 'red_12345',
      status: 'PENDING',
      destinationAddress: 'GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with a valid testnet pubkey
      amount: '10.5',
    },
  ];

  async getPending(limit: number = 50): Promise<Redemption[]> {
    return this.redemptions.filter((r) => r.status === 'PENDING').slice(0, limit);
  }

  async markCompleted(id: string, txHash: string): Promise<void> {
    const record = this.redemptions.find((r) => r.id === id);
    if (record) {
      record.status = 'COMPLETED';
      record.txHash = txHash;
      record.completedAt = new Date();
    }
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const record = this.redemptions.find((r) => r.id === id);
    if (record) {
      record.status = 'FAILED';
      record.errorMessage = errorMessage;
    }
  }
}
