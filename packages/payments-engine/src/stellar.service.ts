import * as StellarSdk from 'stellar-sdk';

export interface ReceivePaymentParams {
  address: string;
  timeoutMs?: number;
  assetCode?: string;
  assetIssuer?: string;
  from?: string;
}

export interface ReceivePaymentResult {
  transactionHash: string;
  amount: string;
  assetCode: string;
  assetIssuer?: string;
  from: string;
  to: string;
  memo?: string | null;
  createdAt: string;
}

export interface PaymentVerificationParams {
  txHash: string;
  expectedDestination: string;
  expectedAmount: string;
  expectedAssetCode?: string;
  expectedAssetIssuer?: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  amount: string;
  asset: string;
  source: string;
  memo?: string | null;
  timestamp: string;
}

export interface AssetPaymentParams {
  destination: string;
  amount: string;
  assetCode: string;
  assetIssuer: string;
}

export interface PaymentResult {
  transactionHash: string;
  assetCode: string;
  assetIssuer: string;
  amount: string;
  destination: string;
}

type IncomingPaymentRecord =
  | StellarSdk.Horizon.ServerApi.PaymentOperationRecord
  | StellarSdk.Horizon.ServerApi.PathPaymentOperationRecord
  | StellarSdk.Horizon.ServerApi.PathPaymentStrictSendOperationRecord;

export class StellarService {
  private server: StellarSdk.Horizon.Server;
  private sourceKeypair!: StellarSdk.Keypair;

  constructor() {
    // Default to testnet if not explicitly set
    const networkUrl = process.env.STELLAR_NETWORK_URL || 'https://horizon-testnet.stellar.org';
    this.server = new StellarSdk.Horizon.Server(networkUrl);

    // In production, this must be securely injected
    const secret =
      process.env.STELLAR_STORAGE_SECRET ||
      'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // Replace with a valid testnet secret for local dev

    try {
      this.sourceKeypair = StellarSdk.Keypair.fromSecret(secret);
    } catch {
      console.warn('Invalid STELLAR_STORAGE_SECRET. Stellar operations will fail.');
    }
  }

  /**
   * Sends funds from the operational storage to a destination address
   */
  async sendFunds(
    destinationAddress: string,
    amount: string,
    assetCode?: string,
    assetIssuer?: string,
  ): Promise<string> {
    try {
      const sourceAccount = await this.server.loadAccount(this.sourceKeypair.publicKey());
      const asset =
        assetCode && assetIssuer
          ? new StellarSdk.Asset(assetCode, assetIssuer)
          : StellarSdk.Asset.native();

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: process.env.STELLAR_NETWORK_URL?.includes('public')
          ? StellarSdk.Networks.PUBLIC
          : StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destinationAddress,
            asset,
            amount: amount,
          }),
        )
        .setTimeout(30)
        .build();

      transaction.sign(this.sourceKeypair);

      const response = await this.server.submitTransaction(transaction);
      return response.hash;
    } catch (error) {
      console.error('Stellar transaction failed:', error);
      throw error; // Rethrow to let the worker handle the failure state
    }
  }

  async verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    const { txHash, expectedDestination, expectedAmount, expectedAssetCode, expectedAssetIssuer } =
      params;

    try {
      const transaction = await this.server.transactions().transaction(txHash).call();

      const operations = await this.server.operations().forTransaction(txHash).call();

      const paymentOp = operations.records.find(
        (op) =>
          op.type === 'payment' ||
          op.type === 'path_payment_strict_receive' ||
          op.type === 'path_payment_strict_send',
      ) as IncomingPaymentRecord | undefined;

      if (!paymentOp) {
        return {
          verified: false,
          amount: '',
          asset: '',
          source: transaction.source_account,
          memo: typeof transaction.memo === 'string' ? transaction.memo : null,
          timestamp: transaction.created_at,
        };
      }

      const paymentAssetCode = paymentOp.asset_code || 'XLM';
      const paymentAssetIssuer = paymentOp.asset_issuer;
      const asset = paymentAssetCode + (paymentAssetIssuer ? `:${paymentAssetIssuer}` : '');

      const destinationMatch = paymentOp.to === expectedDestination;
      const amountMatch = paymentOp.amount === expectedAmount;
      const assetCodeMatch = !expectedAssetCode || paymentAssetCode === expectedAssetCode;
      const assetIssuerMatch = !expectedAssetIssuer || paymentAssetIssuer === expectedAssetIssuer;

      return {
        verified: destinationMatch && amountMatch && assetCodeMatch && assetIssuerMatch,
        amount: paymentOp.amount,
        asset,
        source: paymentOp.from,
        memo: typeof transaction.memo === 'string' ? transaction.memo : null,
        timestamp: transaction.created_at,
      };
    } catch (error) {
      console.error('Failed to verify payment:', error);
      throw error;
    }
  }

  async createReceivePayment(params: ReceivePaymentParams): Promise<ReceivePaymentResult> {
    const { address, timeoutMs = 30000, assetCode, assetIssuer, from } = params;

    if (!StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
      throw new Error(`Invalid Stellar address: ${address}`);
    }

    return new Promise<ReceivePaymentResult>((resolve, reject) => {
      let streamClosed = false;
      const cleanup = () => {
        if (!streamClosed && subscription) {
          subscription();
          streamClosed = true;
        }
        clearTimeout(timer);
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for incoming payment to ${address}`));
      }, timeoutMs);

      let subscription: (() => void) | undefined;

      try {
        subscription = this.server
          .payments()
          .forAccount(address)
          .cursor('now')
          .stream({
            onmessage: (payment: StellarSdk.Horizon.ServerApi.OperationRecord) => {
              if (
                payment.type !== 'payment' &&
                payment.type !== 'path_payment_strict_receive' &&
                payment.type !== 'path_payment_strict_send'
              ) {
                return;
              }

              const paymentRecord = payment as IncomingPaymentRecord;

              if (paymentRecord.to !== address) {
                return;
              }

              if (from && paymentRecord.from !== from) {
                return;
              }

              const paymentAssetCode = paymentRecord.asset_code || 'XLM';
              const paymentAssetIssuer = paymentRecord.asset_issuer;

              if (assetCode && paymentAssetCode !== assetCode) {
                return;
              }

              if (assetIssuer && paymentAssetIssuer !== assetIssuer) {
                return;
              }

              cleanup();
              const transactionMemo = (paymentRecord as unknown as { transaction_memo?: unknown })
                .transaction_memo;

              resolve({
                transactionHash: paymentRecord.transaction_hash,
                amount: paymentRecord.amount,
                assetCode: paymentAssetCode,
                assetIssuer: paymentAssetIssuer,
                from: paymentRecord.from,
                to: paymentRecord.to,
                memo: typeof transactionMemo === 'string' ? transactionMemo : null,
                createdAt: paymentRecord.created_at,
              });
            },
            onerror: (event: MessageEvent) => {
              cleanup();
              reject(new Error(`Stellar stream error: ${event?.type || 'unknown'}`));
            },
          });
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }

  async createAssetPayment(params: AssetPaymentParams): Promise<PaymentResult> {
    const { destination, amount, assetCode, assetIssuer } = params;

    if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
      throw new Error(`Invalid Stellar address: ${destination}`);
    }

    const hasTrustline = await this.verifyTrustline(destination, assetCode, assetIssuer);
    if (!hasTrustline) {
      throw new Error(
        `Destination account ${destination} does not have a trustline for ${assetCode}:${assetIssuer}`,
      );
    }

    const transactionHash = await this.sendFunds(destination, amount, assetCode, assetIssuer);

    return {
      transactionHash,
      assetCode,
      assetIssuer,
      amount,
      destination,
    };
  }

  private async verifyTrustline(
    destination: string,
    assetCode: string,
    assetIssuer: string,
  ): Promise<boolean> {
    try {
      const account = await this.server.loadAccount(destination);
      return account.balances.some(
        (b) =>
          'asset_code' in b &&
          (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_code === assetCode &&
          (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer === assetIssuer,
      );
    } catch {
      throw new Error(`Unable to verify trustline for ${destination}`);
    }
  }
}
