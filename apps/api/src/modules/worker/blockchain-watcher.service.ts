import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface WatchedDeposit {
  id: string;
  address: string;
  expectedAmount: number;
  currency: string;
  merchantId: string;
  paymentReference: string;
  detected: boolean;
  detectedAt: string | null;
  detectedTxHash: string | null;
  detectedAmount: number | null;
  createdAt: string;
}

export interface DepositDetection {
  id: string;
  address: string;
  paymentReference: string;
  expectedAmount: number;
  detectedAmount: number;
  txHash: string;
  detectedAt: string;
}

@Injectable()
export class BlockchainWatcher {
  private readonly logger = new Logger(BlockchainWatcher.name);
  private readonly deposits = new Map<string, WatchedDeposit>();
  private readonly detections: DepositDetection[] = [];

  private readonly horizonUrl =
    process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

  watchDeposit(params: {
    id: string;
    address: string;
    expectedAmount: number;
    currency: string;
    merchantId: string;
    paymentReference: string;
  }): void {
    const deposit: WatchedDeposit = {
      id: params.id,
      address: params.address,
      expectedAmount: params.expectedAmount,
      currency: params.currency,
      merchantId: params.merchantId,
      paymentReference: params.paymentReference,
      detected: false,
      detectedAt: null,
      detectedTxHash: null,
      detectedAmount: null,
      createdAt: new Date().toISOString(),
    };
    this.deposits.set(params.id, deposit);
    this.logger.log(
      `Now watching ${params.address} for ${params.expectedAmount} ${params.currency}`,
    );
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollIncomingTransactions(): Promise<void> {
    const undetected = Array.from(this.deposits.values()).filter((d) => !d.detected);
    if (undetected.length === 0) return;

    this.logger.debug(`Polling ${undetected.length} deposit addresses...`);

    const results = await Promise.allSettled(
      undetected.map((deposit) => this.checkAddress(deposit)),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Polling failed: ${result.reason}`);
      }
    }
  }

  private async checkAddress(deposit: WatchedDeposit): Promise<void> {
    const url = `${this.horizonUrl}/accounts/${deposit.address}/payments?order=desc&limit=10`;

    const res = await fetch(url);
    if (!res.ok) {
      this.logger.warn(`Horizon returned ${res.status} for ${deposit.address}`);
      return;
    }

    const body = (await res.json()) as {
      _embedded: { records: Array<{ type: string; amount: string; transaction_hash: string }> };
    };

    const incoming = body._embedded.records.filter(
      (r) => r.type === 'payment' && parseFloat(r.amount) >= deposit.expectedAmount,
    );

    if (incoming.length === 0) return;

    const match = incoming[0];
    deposit.detected = true;
    deposit.detectedAt = new Date().toISOString();
    deposit.detectedTxHash = match.transaction_hash;
    deposit.detectedAmount = parseFloat(match.amount);

    this.detections.push({
      id: deposit.id,
      address: deposit.address,
      paymentReference: deposit.paymentReference,
      expectedAmount: deposit.expectedAmount,
      detectedAmount: parseFloat(match.amount),
      txHash: match.transaction_hash,
      detectedAt: deposit.detectedAt,
    });

    this.logger.log(
      `[DETECTED] Payment intent ${deposit.paymentReference}: ` +
        `received ${match.amount} ${deposit.currency} ` +
        `(expected >= ${deposit.expectedAmount}) ` +
        `tx: ${match.transaction_hash}`,
    );
  }

  getWatchedDeposits(): WatchedDeposit[] {
    return Array.from(this.deposits.values());
  }

  getDetectedDeposits(): DepositDetection[] {
    return [...this.detections];
  }
}
