import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TransactionNetwork, TransactionStatus } from './interfaces/transaction.interface';
import { TransactionsService } from './transactions.service';

@Injectable()
export class TransactionMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TransactionMonitorService.name);
  private pollTimer: NodeJS.Timeout | null = null;

  private readonly POLL_INTERVAL_MS = parseInt(process.env.MONITOR_POLL_INTERVAL_MS ?? '10000', 10);
  private readonly STELLAR_HORIZON_URL =
    process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
  private readonly BTC_API_URL = process.env.BTC_API_URL ?? 'https://blockstream.info/api';
  private readonly ETH_RPC_URL =
    process.env.ETH_RPC_URL ?? 'https://cloudflare-eth.com';

  constructor(private readonly transactionsService: TransactionsService) {}

  onModuleInit(): void {
    this.pollTimer = setInterval(() => void this.poll(), this.POLL_INTERVAL_MS);
    this.logger.log(`Transaction monitor started (poll every ${this.POLL_INTERVAL_MS}ms)`);
  }

  onModuleDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.logger.log('Transaction monitor stopped');
  }

  private async poll(): Promise<void> {
    const pending = this.transactionsService.findPending();
    if (pending.length === 0) return;

    await Promise.allSettled(
      pending.map((tx) => this.checkConfirmations(tx.id, tx.network, tx.hash)),
    );
  }

  private async checkConfirmations(
    id: string,
    network: TransactionNetwork,
    hash: string,
  ): Promise<void> {
    try {
      let confirmations: number;

      switch (network) {
        case TransactionNetwork.STELLAR:
          confirmations = await this.getStellarConfirmations(hash);
          break;
        case TransactionNetwork.BTC:
          confirmations = await this.getBtcConfirmations(hash);
          break;
        case TransactionNetwork.ETH:
          confirmations = await this.getEthConfirmations(hash);
          break;
      }

      const updated = this.transactionsService.updateConfirmations(id, confirmations);
      if (updated?.status === TransactionStatus.CONFIRMED) {
        this.logger.log(
          `[${network}] ${hash} confirmed (${confirmations}/${updated.required_confirmations})`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `[${network}] Failed to check ${hash}: ${(err as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Stellar: 1 ledger confirmation
  // ---------------------------------------------------------------------------
  private async getStellarConfirmations(hash: string): Promise<number> {
    const res = await fetch(`${this.STELLAR_HORIZON_URL}/transactions/${hash}`);
    if (res.status === 404) return 0;
    if (!res.ok) throw new Error(`Horizon returned HTTP ${res.status}`);
    // A transaction present in Horizon is already ledger-finalized = 1 confirmation
    return 1;
  }

  // ---------------------------------------------------------------------------
  // BTC: 3 confirmations
  // ---------------------------------------------------------------------------
  private async getBtcConfirmations(txid: string): Promise<number> {
    const [txRes, heightRes] = await Promise.all([
      fetch(`${this.BTC_API_URL}/tx/${txid}`),
      fetch(`${this.BTC_API_URL}/blocks/tip/height`),
    ]);

    if (txRes.status === 404) return 0;
    if (!txRes.ok) throw new Error(`BTC API returned HTTP ${txRes.status}`);

    const tx = (await txRes.json()) as {
      status: { confirmed: boolean; block_height?: number };
    };

    if (!tx.status.confirmed || tx.status.block_height === undefined) return 0;

    const tipHeight = parseInt(await heightRes.text(), 10);
    return tipHeight - tx.status.block_height + 1;
  }

  // ---------------------------------------------------------------------------
  // ETH: 12 confirmations
  // ---------------------------------------------------------------------------
  private async getEthConfirmations(hash: string): Promise<number> {
    const [tx, currentBlock] = await Promise.all([
      this.ethRpc<{ blockNumber: string | null }>('eth_getTransactionByHash', [hash]),
      this.ethRpc<string>('eth_blockNumber', []),
    ]);

    if (!tx || tx.blockNumber === null) return 0;

    const txBlock = parseInt(tx.blockNumber, 16);
    const tipBlock = parseInt(currentBlock, 16);
    return tipBlock - txBlock + 1;
  }

  private async ethRpc<T>(method: string, params: unknown[]): Promise<T> {
    const res = await fetch(this.ETH_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });

    if (!res.ok) throw new Error(`ETH RPC returned HTTP ${res.status}`);

    const body = (await res.json()) as { result: T; error?: { message: string } };
    if (body.error) throw new Error(body.error.message);
    return body.result;
  }
}
