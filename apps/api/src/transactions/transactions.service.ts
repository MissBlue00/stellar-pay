import { Injectable } from '@nestjs/common';
import {
  CONFIRMATION_THRESHOLDS,
  Transaction,
  TransactionNetwork,
  TransactionStatus,
} from './interfaces/transaction.interface';
import { WebhookService } from '../webhooks/webhook.service';
import { WebhookEventType } from '../webhooks/interfaces/webhook-event.interface';

@Injectable()
export class TransactionsService {
  private readonly store = new Map<string, Transaction>();
  private readonly merchantIdMap = new Map<string, string>(); // tx.id -> merchantId

  constructor(private readonly webhookService: WebhookService) {}

  register(hash: string, network: TransactionNetwork, merchantId?: string): Transaction {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      network,
      hash,
      status: TransactionStatus.PENDING,
      confirmations: 0,
      required_confirmations: CONFIRMATION_THRESHOLDS[network],
      created_at: new Date().toISOString(),
      type: 'deposit',
    };
    this.store.set(tx.id, tx);

    if (merchantId) {
      this.merchantIdMap.set(tx.id, merchantId);
    }

    return tx;
  }

  findAll(
    merchantId?: string,
    opts: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      from?: string;
      to?: string;
    } = {},
  ): Transaction[] {
    const page = Math.max(1, Number(opts.page ?? 1));
    const limit = Math.max(1, Number(opts.limit ?? 20));
    const type = opts.type?.toLowerCase();
    const status = opts.status?.toLowerCase();
    const from = opts.from ? new Date(opts.from).getTime() : undefined;
    const to = opts.to ? new Date(opts.to).getTime() : undefined;

    const txs = Array.from(this.store.values()).filter((tx) => {
      if (merchantId && this.merchantIdMap.get(tx.id) !== merchantId) {
        return false;
      }
      if (type && tx.type?.toLowerCase() !== type) {
        return false;
      }
      if (status && tx.status.toLowerCase() !== status) {
        return false;
      }
      if (from && new Date(tx.created_at).getTime() < from) {
        return false;
      }
      if (to && new Date(tx.created_at).getTime() > to) {
        return false;
      }
      return true;
    });

    txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const start = (page - 1) * limit;
    return txs.slice(start, start + limit);
  }

  findOne(id: string): Transaction | undefined {
    return this.store.get(id);
  }

  findPending(): Transaction[] {
    return Array.from(this.store.values()).filter(
      (tx) => tx.status !== TransactionStatus.CONFIRMED && tx.status !== TransactionStatus.FAILED,
    );
  }

  updateConfirmations(id: string, confirmations: number): Transaction | undefined {
    const tx = this.store.get(id);
    if (!tx) return undefined;

    const previousStatus = tx.status;
    tx.confirmations = confirmations;

    if (confirmations >= tx.required_confirmations) {
      tx.status = TransactionStatus.CONFIRMED;
      tx.confirmed_at ??= new Date().toISOString();

      // Dispatch payment.confirmed webhook event
      const merchantId = this.merchantIdMap.get(id);
      if (merchantId) {
        void this.webhookService.dispatchEvent(merchantId, WebhookEventType.PAYMENT_CONFIRMED, {
          transaction_id: tx.id,
          network: tx.network,
          hash: tx.hash,
          status: tx.status,
          confirmations: tx.confirmations,
          confirmed_at: tx.confirmed_at,
        });
      }
    } else if (confirmations > 0 && tx.status === TransactionStatus.PENDING) {
      tx.status = TransactionStatus.CONFIRMING;

      // Dispatch payment.detected webhook event (first confirmation)
      if (previousStatus === TransactionStatus.PENDING) {
        const merchantId = this.merchantIdMap.get(id);
        if (merchantId) {
          void this.webhookService.dispatchEvent(merchantId, WebhookEventType.PAYMENT_DETECTED, {
            transaction_id: tx.id,
            network: tx.network,
            hash: tx.hash,
            status: tx.status,
            confirmations: tx.confirmations,
          });
        }
      }
    }

    return tx;
  }

  markFailed(id: string, reason: string): Transaction | undefined {
    const tx = this.store.get(id);
    if (!tx) return undefined;

    tx.status = TransactionStatus.FAILED;

    // Dispatch payment.failed webhook event
    const merchantId = this.merchantIdMap.get(id);
    if (merchantId) {
      void this.webhookService.dispatchEvent(merchantId, WebhookEventType.PAYMENT_FAILED, {
        transaction_id: tx.id,
        network: tx.network,
        hash: tx.hash,
        status: tx.status,
        reason,
      });
    }

    return tx;
  }
}
