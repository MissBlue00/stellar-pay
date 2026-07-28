import * as StellarSdk from 'stellar-sdk';

export type MemoType = 'text' | 'id' | 'hash' | 'none' | 'return';

export interface ParsedPaymentMemo {
  type: MemoType;
  value: string | null;
  valid: boolean;
}

export function parsePaymentMemo(memo: StellarSdk.Memo | null | undefined): ParsedPaymentMemo {
  if (!memo) {
    return {
      type: 'none',
      value: null,
      valid: true,
    };
  }

  try {
    let type: MemoType;
    let value: string | null = null;
    let valid = true;

    switch (memo.type) {
      case StellarSdk.MemoText:
        type = 'text';
        value =
          typeof memo.value === 'string'
            ? memo.value
            : ((memo.value as unknown as Buffer | null)?.toString() ?? null);
        break;
      case StellarSdk.MemoID:
        type = 'id';
        value = memo.value != null ? memo.value.toString() : null;
        break;
      case StellarSdk.MemoHash:
      case StellarSdk.MemoReturn:
        type = memo.type === StellarSdk.MemoHash ? 'hash' : 'return';
        value = memo.value != null ? (memo.value as unknown as Buffer).toString('hex') : null;
        break;
      case StellarSdk.MemoNone:
        type = 'none';
        value = null;
        break;
      default:
        type = 'none';
        value = null;
        valid = false;
    }

    return {
      type,
      value,
      valid,
    };
  } catch {
    return {
      type: 'none',
      value: null,
      valid: false,
    };
  }
}

export function parsePaymentMemoFromTransaction(
  transaction: StellarSdk.Transaction | StellarSdk.Horizon.ServerApi.TransactionRecord,
): ParsedPaymentMemo {
  try {
    if ('memo' in transaction) {
      if (transaction.memo instanceof StellarSdk.Memo) {
        return parsePaymentMemo(transaction.memo);
      }
      if (typeof transaction.memo === 'string') {
        return {
          type: 'text',
          value: transaction.memo,
          valid: true,
        };
      }
      if (transaction.memo === null || transaction.memo === undefined) {
        return {
          type: 'none',
          value: null,
          valid: true,
        };
      }
    }
    return {
      type: 'none',
      value: null,
      valid: false,
    };
  } catch {
    return {
      type: 'none',
      value: null,
      valid: false,
    };
  }
}

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

export interface AssetPaymentParams {
  destination: string;
  assetCode: string;
  assetIssuer: string;
  amount: string;
}

export interface PaymentResult {
  transactionHash: string;
  assetCode: string;
  assetIssuer: string;
  amount: string;
  destination: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  amount: string;
  asset: string;
  source: string;
  memo?: string | null;
  timestamp: string;
}

export type BuildTxMemoType = 'none' | 'text' | 'id' | 'hash' | 'return';

export interface BuildTxMemo {
  type: BuildTxMemoType;
  /**
   * Memo payload:
   * - `text`: string (max 28 bytes)
   * - `id`: string or number (uint64)
   * - `hash` / `return`: 32-byte Buffer or 64-char hex string
   */
  value?: string | number | Buffer;
}

export interface BuildTxAsset {
  /** Asset code, e.g. `USDC`. Omit or use `native` / `XLM` for lumens. */
  code?: string;
  /** Issuer public key. Required for non-native assets. */
  issuer?: string;
}

/**
 * Parameters for {@link StellarService.buildSignedTransaction}.
 *
 * The source account sequence number is loaded from Horizon automatically —
 * only the public key is required here.
 */
export interface BuildTxParams {
  /** Public key of the source account. */
  sourcePublicKey: string;
  /** Destination public key. */
  destination: string;
  /** Payment amount as a decimal string, e.g. `"10.5"`. */
  amount: string;
  /** Asset to send. Defaults to native XLM when omitted. */
  asset?: BuildTxAsset;
  /** Optional transaction memo. */
  memo?: BuildTxMemo;
  /**
   * Base fee in stroops. Defaults to {@link StellarSdk.BASE_FEE}.
   * Must be a positive integer string or number.
   */
  fee?: string | number;
  /** Secret key used to sign the transaction. */
  secretKey: string;
}

type IncomingPaymentRecord =
  | StellarSdk.Horizon.ServerApi.PaymentOperationRecord
  | StellarSdk.Horizon.ServerApi.PathPaymentOperationRecord
  | StellarSdk.Horizon.ServerApi.PathPaymentStrictSendOperationRecord;

export interface AmountValidationResult {
  valid: boolean;
  error?: string;
}

const ASSET_MINIMUM_AMOUNTS: Record<string, number> = {
  XLM: 0.00001,
  NATIVE: 0.00001,
  USDC: 0.00001,
  EURC: 0.00001,
};

export function validateAmount(
  amount: string,
  assetCode?: string,
): AmountValidationResult {
  if (typeof amount !== 'string' || amount.trim() === '') {
    return { valid: false, error: 'Amount must be a non-empty string' };
  }

  const trimmed = amount.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { valid: false, error: 'Invalid amount format' };
  }

  const num = parseFloat(trimmed);

  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Invalid amount format' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }

  if (trimmed.includes('.')) {
    const decimals = trimmed.split('.')[1];
    if (decimals && decimals.length > 7) {
      return {
        valid: false,
        error: 'Amount exceeds maximum Stellar decimal precision (7 decimal places)',
      };
    }
  }

  const code = (assetCode || 'XLM').toUpperCase();
  const minAmount = ASSET_MINIMUM_AMOUNTS[code] ?? 0.00001;

  if (num < minAmount) {
    return {
      valid: false,
      error: `Amount is below the minimum required amount of ${minAmount} for ${code}`,
    };
  }

  return { valid: true };
}

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
   * Validates a Stellar payment amount.
   */
  validateAmount(amount: string, assetCode?: string): AmountValidationResult {
    return validateAmount(amount, assetCode);
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

  async checkTrustline(
    destination: string,
    assetCode: string,
    assetIssuer: string,
  ): Promise<boolean> {
    const account = await this.server.loadAccount(destination);
    return account.balances.some(
      (balance) =>
        (balance as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_code === assetCode &&
        (balance as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer === assetIssuer,
    );
  }

  async createAssetPayment(params: AssetPaymentParams): Promise<PaymentResult> {
    const { destination, assetCode, assetIssuer, amount } = params;

    if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
      throw new Error(`Invalid destination address: ${destination}`);
    }

    const hasTrustline = await this.checkTrustline(destination, assetCode, assetIssuer);
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

  /**
   * Builds and signs a Stellar payment transaction in one step.
   *
   * Loads the source account sequence number from Horizon, constructs a
   * payment operation, applies an optional memo, signs the transaction with
   * the provided secret key, and returns the signed {@link StellarSdk.Transaction}.
   *
   * @param params - {@link BuildTxParams}
   * @returns Signed transaction ready for submission via `server.submitTransaction`.
   */
  async buildSignedTransaction(params: BuildTxParams): Promise<StellarSdk.Transaction> {
    const {
      sourcePublicKey,
      destination,
      amount,
      asset: assetInput,
      memo: memoInput,
      fee,
      secretKey,
    } = params;

    // Validate addresses
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(sourcePublicKey)) {
      throw new Error(`Invalid source public key: ${sourcePublicKey}`);
    }
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
      throw new Error(`Invalid destination address: ${destination}`);
    }

    // Validate amount
    const numericAmount = Number(amount);
    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new Error(`Invalid payment amount: ${String(amount)}`);
    }

    // Resolve asset
    const code = assetInput?.code?.trim();
    const isNative = !code || code === 'native' || code === 'XLM';
    let resolvedAsset: StellarSdk.Asset;
    if (isNative) {
      if (assetInput?.issuer) {
        throw new Error('Native asset cannot include an issuer');
      }
      resolvedAsset = StellarSdk.Asset.native();
    } else {
      if (!assetInput?.issuer) {
        throw new Error(`Issuer is required for asset ${code}`);
      }
      resolvedAsset = new StellarSdk.Asset(code, assetInput.issuer);
    }

    // Resolve fee
    const feeValue = fee !== undefined ? Number(fee) : Number(StellarSdk.BASE_FEE);
    if (!Number.isFinite(feeValue) || feeValue <= 0) {
      throw new Error(`Invalid fee: ${String(fee)}`);
    }
    const resolvedFee = String(Math.trunc(feeValue));

    // Determine network passphrase
    const networkPassphrase = process.env.STELLAR_NETWORK_URL?.includes('public')
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET;

    // Load source account sequence number from Horizon
    const sourceAccount = await this.server.loadAccount(sourcePublicKey);

    // Build transaction
    let builder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: resolvedFee,
      networkPassphrase,
    }).addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: resolvedAsset,
        amount,
      }),
    );

    // Apply optional memo
    if (memoInput && memoInput.type !== 'none') {
      let memo: StellarSdk.Memo;
      switch (memoInput.type) {
        case 'text': {
          if (typeof memoInput.value !== 'string' || memoInput.value.length === 0) {
            throw new Error('Text memo requires a non-empty string value');
          }
          if (Buffer.byteLength(memoInput.value, 'utf8') > 28) {
            throw new Error('Text memo must be at most 28 bytes');
          }
          memo = StellarSdk.Memo.text(memoInput.value);
          break;
        }
        case 'id': {
          if (memoInput.value === undefined || memoInput.value === null || memoInput.value === '') {
            throw new Error('ID memo requires a numeric value');
          }
          const id =
            typeof memoInput.value === 'number' ? memoInput.value : Number(memoInput.value);
          if (!Number.isInteger(id) || id < 0) {
            throw new Error(`Invalid ID memo value: ${String(memoInput.value)}`);
          }
          memo = StellarSdk.Memo.id(String(id));
          break;
        }
        case 'hash':
        case 'return': {
          const rawValue = memoInput.value as string | Buffer;
          let buf: Buffer;
          if (Buffer.isBuffer(rawValue)) {
            if (rawValue.length !== 32) {
              throw new Error(`Memo hash/return must be 32 bytes, got ${rawValue.length}`);
            }
            buf = rawValue;
          } else if (typeof rawValue === 'string') {
            const hex = rawValue.startsWith('0x') ? rawValue.slice(2) : rawValue;
            if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
              throw new Error(
                'Memo hash/return must be a 64-character hex string or 32-byte Buffer',
              );
            }
            buf = Buffer.from(hex, 'hex');
          } else {
            throw new Error('Memo hash/return value must be a hex string or Buffer');
          }
          memo =
            memoInput.type === 'hash'
              ? StellarSdk.Memo.hash(buf)
              : StellarSdk.Memo.return(buf.toString('hex'));
          break;
        }
        default:
          throw new Error(`Unsupported memo type: ${String((memoInput as BuildTxMemo).type)}`);
      }
      builder = builder.addMemo(memo);
    }

    const transaction = builder.setTimeout(30).build();

    // Sign with provided secret key
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    transaction.sign(keypair);

    return transaction;
  }
}
