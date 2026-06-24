import * as StellarSdk from 'stellar-sdk';

export type PaymentMemoType = 'none' | 'text' | 'id' | 'hash' | 'return';

export interface PaymentAssetInput {
  /** Asset code, e.g. `USDC`. Omit or use `native` / `XLM` for lumens. */
  code?: string;
  /** Issuer public key. Required for non-native assets. */
  issuer?: string;
}

export interface PaymentMemoInput {
  type: PaymentMemoType;
  /**
   * Memo payload:
   * - `text`: string (max 28 bytes)
   * - `id`: string or number (uint64)
   * - `hash` / `return`: 32-byte Buffer or 64-char hex string
   */
  value?: string | number | Buffer;
}

export type SourceAccountInput = StellarSdk.Account | StellarSdk.Horizon.HorizonApi.AccountResponse;

export interface BuildTransactionParamsInput {
  sourceAccount: SourceAccountInput;
  destination: string;
  amount: string;
  asset: PaymentAssetInput;
  memo?: PaymentMemoInput;
  fee: string | number;
  /** Defaults to `StellarSdk.Networks.TESTNET`. */
  networkPassphrase?: string;
  /** Defaults to `30` seconds. */
  timeout?: number;
}

export type PaymentOperation = ReturnType<typeof StellarSdk.Operation.payment>;

export interface BuiltTransactionParams {
  sourceAccount: StellarSdk.Account;
  destination: string;
  amount: string;
  asset: StellarSdk.Asset;
  fee: string;
  networkPassphrase: string;
  timeout: number;
  operation: PaymentOperation;
  memo?: StellarSdk.Memo;
}

function normalizeSourceAccount(account: SourceAccountInput): StellarSdk.Account {
  if (account instanceof StellarSdk.Account) {
    return account;
  }

  return new StellarSdk.Account(account.account_id, account.sequence);
}

function normalizeFee(fee: string | number): string {
  const feeValue = typeof fee === 'number' ? fee : Number(fee);

  if (!Number.isFinite(feeValue) || feeValue <= 0) {
    throw new Error(`Invalid fee: ${String(fee)}`);
  }

  return String(Math.trunc(feeValue));
}

function resolveAsset(asset: PaymentAssetInput): StellarSdk.Asset {
  const code = asset.code?.trim();
  const isNative = !code || code === 'native' || code === 'XLM';

  if (isNative) {
    if (asset.issuer) {
      throw new Error('Native asset cannot include an issuer');
    }

    return StellarSdk.Asset.native();
  }

  if (!asset.issuer) {
    throw new Error(`Issuer is required for asset ${code}`);
  }

  return new StellarSdk.Asset(code, asset.issuer);
}

function toMemoBuffer(value: string | number | Buffer): Buffer {
  if (Buffer.isBuffer(value)) {
    if (value.length !== 32) {
      throw new Error(`Memo hash/return must be 32 bytes, got ${value.length}`);
    }

    return value;
  }

  if (typeof value === 'string') {
    const hex = value.startsWith('0x') ? value.slice(2) : value;

    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      throw new Error('Memo hash/return must be a 64-character hex string or 32-byte Buffer');
    }

    return Buffer.from(hex, 'hex');
  }

  throw new Error('Memo hash/return value must be a hex string or Buffer');
}

export function encodePaymentMemo(memo: PaymentMemoInput): StellarSdk.Memo {
  switch (memo.type) {
    case 'none':
      return StellarSdk.Memo.none();
    case 'text': {
      if (typeof memo.value !== 'string' || memo.value.length === 0) {
        throw new Error('Text memo requires a non-empty string value');
      }

      if (Buffer.byteLength(memo.value, 'utf8') > 28) {
        throw new Error('Text memo must be at most 28 bytes');
      }

      return StellarSdk.Memo.text(memo.value);
    }
    case 'id': {
      if (memo.value === undefined || memo.value === null || memo.value === '') {
        throw new Error('ID memo requires a numeric value');
      }

      const id = typeof memo.value === 'number' ? memo.value : Number(memo.value);

      if (!Number.isInteger(id) || id < 0) {
        throw new Error(`Invalid ID memo value: ${String(memo.value)}`);
      }

      return StellarSdk.Memo.id(String(id));
    }
    case 'hash':
      return StellarSdk.Memo.hash(toMemoBuffer(memo.value as string | Buffer));
    case 'return':
      return StellarSdk.Memo.return(toMemoBuffer(memo.value as string | Buffer).toString('hex'));
    default:
      throw new Error(`Unsupported memo type: ${String(memo.type)}`);
  }
}

/**
 * Constructs Stellar transaction parameters for a payment operation.
 * The returned values can be passed directly to `TransactionBuilder`.
 */
export function buildTransactionParams(input: BuildTransactionParamsInput): BuiltTransactionParams {
  const { destination, amount, asset, memo, fee, networkPassphrase, timeout = 30 } = input;

  if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
    throw new Error(`Invalid destination address: ${destination}`);
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error(`Invalid payment amount: ${amount}`);
  }

  const sourceAccount = normalizeSourceAccount(input.sourceAccount);
  const resolvedAsset = resolveAsset(asset);
  const normalizedFee = normalizeFee(fee);
  const resolvedNetworkPassphrase = networkPassphrase ?? StellarSdk.Networks.TESTNET;

  const operation = StellarSdk.Operation.payment({
    destination,
    asset: resolvedAsset,
    amount,
  });

  const built: BuiltTransactionParams = {
    sourceAccount,
    destination,
    amount,
    asset: resolvedAsset,
    fee: normalizedFee,
    networkPassphrase: resolvedNetworkPassphrase,
    timeout,
    operation,
  };

  if (memo && memo.type !== 'none') {
    built.memo = encodePaymentMemo(memo);
  }

  return built;
}

/**
 * Builds a Stellar transaction from params produced by `buildTransactionParams`.
 */
export function buildTransactionFromParams(params: BuiltTransactionParams): StellarSdk.Transaction {
  let builder = new StellarSdk.TransactionBuilder(params.sourceAccount, {
    fee: params.fee,
    networkPassphrase: params.networkPassphrase,
  }).addOperation(params.operation);

  if (params.memo) {
    builder = builder.addMemo(params.memo);
  }

  return builder.setTimeout(params.timeout).build();
}
