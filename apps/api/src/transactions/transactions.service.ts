import { Injectable } from '@nestjs/common';
import {
  CONFIRMATION_THRESHOLDS,
  Transaction,
  TransactionNetwork,
  TransactionStatus,
} from './interfaces/transaction.interface';

@Injectable()
export class TransactionsService {
  private readonly store = new Map<string, Transaction>();

  register(hash: string, network: TransactionNetwork): Transaction {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      network,
      hash,
      status: TransactionStatus.PENDING,
      confirmations: 0,
      required_confirmations: CONFIRMATION_THRESHOLDS[network],
      created_at: new Date().toISOString(),
    };
    this.store.set(tx.id, tx);
    return tx;
  }

  findAll(): Transaction[] {
    return Array.from(this.store.values());
  }

  findOne(id: string): Transaction | undefined {
    return this.store.get(id);
  }

  findPending(): Transaction[] {
    return Array.from(this.store.values()).filter(
      (tx) =>
        tx.status !== TransactionStatus.CONFIRMED && tx.status !== TransactionStatus.FAILED,
    );
  }

  updateConfirmations(id: string, confirmations: number): Transaction | undefined {
    const tx = this.store.get(id);
    if (!tx) return undefined;

    tx.confirmations = confirmations;

    if (confirmations >= tx.required_confirmations) {
      tx.status = TransactionStatus.CONFIRMED;
      tx.confirmed_at ??= new Date().toISOString();
    } else if (confirmations > 0 && tx.status === TransactionStatus.PENDING) {
      tx.status = TransactionStatus.CONFIRMING;
    }

    return tx;
  }
}
