import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { TransactionWatcher } from '@stellar-pay/payments-engine';
import { Horizon } from '@stellar/stellar-sdk';

/**
 * The WatcherService is the NestJS wrapper around the core TransactionWatcher.
 * It manages the lifecycle of the blockchain stream within the worker application.
 */
@Injectable()
export class WatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WatcherService.name);
  private watcher: TransactionWatcher;

  constructor() {
    // In a real application, these should come from ConfigService
    const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    const accountFilter = process.env.STELLAR_ACCOUNT_FILTER;
    
    this.watcher = new TransactionWatcher(
      {
        horizonUrl,
        restartOnDisconnect: true,
        accountFilter,
      },
      {
        onTransaction: this.handleTransaction.bind(this),
        onOperation: this.handleOperation.bind(this),
      }
    );
  }

  /**
   * Called by NestJS when the module is initialized.
   */
  async onModuleInit() {
    this.logger.log('Initializing Blockchain Transaction Watcher...');
    // We could potentially fetch the last saved cursor from a database here
    this.watcher.start('now');
  }

  /**
   * Called by NestJS when the module is being destroyed.
   */
  async onModuleDestroy() {
    this.logger.log('Stopping Blockchain Transaction Watcher...');
    this.watcher.stop();
  }

  /**
   * Handler for new transactions discovered on the network.
   */
  private async handleTransaction(tx: Horizon.ServerApi.TransactionRecord) {
    this.logger.log(`[TX] New transaction: ${tx.id} (Source: ${tx.source_account})`);
    
    // TODO: Reconciliation logic
    // 1. Check if transaction memo matches any pending PaymentIntent
    // 2. Update status of the payment intent to 'processing' or 'settled'
    // 3. Trigger webhooks/notifications
  }

  /**
   * Handler for individual operations within transactions.
   * Useful for granular tracking like path payments or claimable balances.
   */
  private async handleOperation(op: Horizon.ServerApi.OperationRecord) {
    // We only log interesting operations for now
    if (op.type === 'payment' || op.type === 'path_payment_strict_send' || op.type === 'path_payment_strict_receive') {
      this.logger.debug(`[OP] Observed payment-related operation: ${op.id} of type ${op.type}`);
    }
  }
}
