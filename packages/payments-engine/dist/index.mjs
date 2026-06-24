// src/build-transaction-params.ts
import * as StellarSdk from "stellar-sdk";
function normalizeSourceAccount(account) {
  if (account instanceof StellarSdk.Account) {
    return account;
  }
  return new StellarSdk.Account(account.account_id, account.sequence);
}
function normalizeFee(fee) {
  const feeValue = typeof fee === "number" ? fee : Number(fee);
  if (!Number.isFinite(feeValue) || feeValue <= 0) {
    throw new Error(`Invalid fee: ${String(fee)}`);
  }
  return String(Math.trunc(feeValue));
}
function resolveAsset(asset) {
  const code = asset.code?.trim();
  const isNative = !code || code === "native" || code === "XLM";
  if (isNative) {
    if (asset.issuer) {
      throw new Error("Native asset cannot include an issuer");
    }
    return StellarSdk.Asset.native();
  }
  if (!asset.issuer) {
    throw new Error(`Issuer is required for asset ${code}`);
  }
  return new StellarSdk.Asset(code, asset.issuer);
}
function toMemoBuffer(value) {
  if (Buffer.isBuffer(value)) {
    if (value.length !== 32) {
      throw new Error(`Memo hash/return must be 32 bytes, got ${value.length}`);
    }
    return value;
  }
  if (typeof value === "string") {
    const hex = value.startsWith("0x") ? value.slice(2) : value;
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      throw new Error("Memo hash/return must be a 64-character hex string or 32-byte Buffer");
    }
    return Buffer.from(hex, "hex");
  }
  throw new Error("Memo hash/return value must be a hex string or Buffer");
}
function encodePaymentMemo(memo) {
  switch (memo.type) {
    case "none":
      return StellarSdk.Memo.none();
    case "text": {
      if (typeof memo.value !== "string" || memo.value.length === 0) {
        throw new Error("Text memo requires a non-empty string value");
      }
      if (Buffer.byteLength(memo.value, "utf8") > 28) {
        throw new Error("Text memo must be at most 28 bytes");
      }
      return StellarSdk.Memo.text(memo.value);
    }
    case "id": {
      if (memo.value === void 0 || memo.value === null || memo.value === "") {
        throw new Error("ID memo requires a numeric value");
      }
      const id = typeof memo.value === "number" ? memo.value : Number(memo.value);
      if (!Number.isInteger(id) || id < 0) {
        throw new Error(`Invalid ID memo value: ${String(memo.value)}`);
      }
      return StellarSdk.Memo.id(String(id));
    }
    case "hash":
      return StellarSdk.Memo.hash(toMemoBuffer(memo.value));
    case "return":
      return StellarSdk.Memo.return(
        toMemoBuffer(memo.value).toString("hex")
      );
    default:
      throw new Error(`Unsupported memo type: ${String(memo.type)}`);
  }
}
function buildTransactionParams(input) {
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
    amount
  });
  const built = {
    sourceAccount,
    destination,
    amount,
    asset: resolvedAsset,
    fee: normalizedFee,
    networkPassphrase: resolvedNetworkPassphrase,
    timeout,
    operation
  };
  if (memo && memo.type !== "none") {
    built.memo = encodePaymentMemo(memo);
  }
  return built;
}
function buildTransactionFromParams(params) {
  let builder = new StellarSdk.TransactionBuilder(params.sourceAccount, {
    fee: params.fee,
    networkPassphrase: params.networkPassphrase
  }).addOperation(params.operation);
  if (params.memo) {
    builder = builder.addMemo(params.memo);
  }
  return builder.setTimeout(params.timeout).build();
}

// src/stellar.service.ts
import * as StellarSdk2 from "stellar-sdk";
var StellarService = class {
  server;
  sourceKeypair;
  constructor() {
    const networkUrl = process.env.STELLAR_NETWORK_URL || "https://horizon-testnet.stellar.org";
    this.server = new StellarSdk2.Horizon.Server(networkUrl);
    const secret = process.env.STELLAR_STORAGE_SECRET || "SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    try {
      this.sourceKeypair = StellarSdk2.Keypair.fromSecret(secret);
    } catch {
      console.warn("Invalid STELLAR_STORAGE_SECRET. Stellar operations will fail.");
    }
  }
  /**
   * Sends funds from the operational storage to a destination address
   */
  async sendFunds(destinationAddress, amount, assetCode, assetIssuer) {
    try {
      const sourceAccount = await this.server.loadAccount(this.sourceKeypair.publicKey());
      const asset = assetCode && assetIssuer ? new StellarSdk2.Asset(assetCode, assetIssuer) : StellarSdk2.Asset.native();
      const transaction = new StellarSdk2.TransactionBuilder(sourceAccount, {
        fee: StellarSdk2.BASE_FEE,
        networkPassphrase: process.env.STELLAR_NETWORK_URL?.includes("public") ? StellarSdk2.Networks.PUBLIC : StellarSdk2.Networks.TESTNET
      }).addOperation(
        StellarSdk2.Operation.payment({
          destination: destinationAddress,
          asset,
          amount
        })
      ).setTimeout(30).build();
      transaction.sign(this.sourceKeypair);
      const response = await this.server.submitTransaction(transaction);
      return response.hash;
    } catch (error) {
      console.error("Stellar transaction failed:", error);
      throw error;
    }
  }
  async createReceivePayment(params) {
    const { address, timeoutMs = 3e4, assetCode, assetIssuer, from } = params;
    if (!StellarSdk2.StrKey.isValidEd25519PublicKey(address)) {
      throw new Error(`Invalid Stellar address: ${address}`);
    }
    return new Promise((resolve, reject) => {
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
      let subscription;
      try {
        subscription = this.server.payments().forAccount(address).cursor("now").stream({
          onmessage: (payment) => {
            if (payment.type !== "payment" && payment.type !== "path_payment_strict_receive" && payment.type !== "path_payment_strict_send") {
              return;
            }
            const paymentRecord = payment;
            if (paymentRecord.to !== address) {
              return;
            }
            if (from && paymentRecord.from !== from) {
              return;
            }
            const paymentAssetCode = paymentRecord.asset_code || "XLM";
            const paymentAssetIssuer = paymentRecord.asset_issuer;
            if (assetCode && paymentAssetCode !== assetCode) {
              return;
            }
            if (assetIssuer && paymentAssetIssuer !== assetIssuer) {
              return;
            }
            cleanup();
            const transactionMemo = paymentRecord.transaction_memo;
            resolve({
              transactionHash: paymentRecord.transaction_hash,
              amount: paymentRecord.amount,
              assetCode: paymentAssetCode,
              assetIssuer: paymentAssetIssuer,
              from: paymentRecord.from,
              to: paymentRecord.to,
              memo: typeof transactionMemo === "string" ? transactionMemo : null,
              createdAt: paymentRecord.created_at
            });
          },
          onerror: (event) => {
            cleanup();
            reject(new Error(`Stellar stream error: ${event?.type || "unknown"}`));
          }
        });
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }
};
export {
  StellarService,
  buildTransactionFromParams,
  buildTransactionParams,
  encodePaymentMemo
};
