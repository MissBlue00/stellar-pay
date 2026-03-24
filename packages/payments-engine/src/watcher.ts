import { Horizon } from '@stellar/stellar-sdk';

/**
 * Interface for the Transaction Watcher callback handlers.
 */
export interface WatcherHandlers {
  onTransaction?: (tx: Horizon.ServerApi.TransactionRecord) => Promise<void>;
  onOperation?: (op: Horizon.ServerApi.OperationRecord) => Promise<void>;
}

/**
 * Options for the TransactionWatcher.
 */
export interface WatcherOptions {
  horizonUrl: string;
  networkPassphrase?: string;
  restartOnDisconnect?: boolean;
  accountFilter?: string; // Optional account to watch specifically
}

/**
 * The TransactionWatcher is responsible for streaming transactions and operations
 * from the Stellar network (via Horizon) and triggering associated logic.
 */
export class TransactionWatcher {
  private server: Horizon.Server;
  private handlers: WatcherHandlers;
  private options: WatcherOptions;
  private closeStream?: () => void;
  private cursor: string = 'now';

  constructor(options: WatcherOptions, handlers: WatcherHandlers) {
    this.server = new Horizon.Server(options.horizonUrl);
    this.handlers = handlers;
    this.options = {
      restartOnDisconnect: true,
      ...options,
    };
  }

  /**
   * Starts the transaction stream from a given cursor (or 'now').
   */
  public start(cursor?: string): void {
    if (cursor) {
      this.cursor = cursor;
    }

    const logMsg = this.options.accountFilter 
      ? `[TransactionWatcher] Starting stream for account ${this.options.accountFilter} from cursor: ${this.cursor}`
      : `[TransactionWatcher] Starting network-wide stream from cursor: ${this.cursor}`;
      
    console.log(`${logMsg} on ${this.options.horizonUrl}`);

    try {
      let query = this.server.transactions();
      
      if (this.options.accountFilter) {
        query = query.forAccount(this.options.accountFilter);
      }

      this.closeStream = query
        .cursor(this.cursor)
        .stream({
          onmessage: async (tx: Horizon.ServerApi.TransactionRecord) => {
            console.debug(`[TransactionWatcher] New transaction observed: ${tx.id}`);
            
            // Update local cursor to current transaction's paging_token
            this.cursor = tx.paging_token;

            // Trigger transaction handler
            if (this.handlers.onTransaction) {
              await this.handlers.onTransaction(tx);
            }

            // Also stream operations for this transaction to allow granular processing
            if (this.handlers.onOperation) {
              const operations = await tx.operations();
              for (const op of operations.records) {
                await this.handlers.onOperation(op);
              }
            }
          },
          onerror: (error: any) => {
            console.error('[TransactionWatcher] Stream encountered an error:', error);
            
            if (this.options.restartOnDisconnect) {
              console.log('[TransactionWatcher] Attempting to restart stream after error...');
              this.stop();
              // Exponential backoff or simply restart? Simple restart for now but in production use backoff
              setTimeout(() => this.start(this.cursor), 5000);
            }
          },
        });
    } catch (error) {
      console.error('[TransactionWatcher] Failed to initialize stream:', error);
    }
  }

  /**
   * Stops the current stream.
   */
  public stop(): void {
    if (this.closeStream) {
      this.closeStream();
      this.closeStream = undefined;
      console.log('[TransactionWatcher] Stream closed.');
    }
  }

  /**
   * Gets the current paging cursor.
   */
  public getCursor(): string {
    return this.cursor;
  }
}
