// src/index.ts
import { TransactionBuilder as TransactionBuilder2, BASE_FEE as BASE_FEE2 } from "stellar-sdk";

// src/stellar.service.ts
import * as StellarSdk from "stellar-sdk";
var StellarService = class {
  server;
  sourceKeypair;
  constructor() {
    const networkUrl = process.env.STELLAR_NETWORK_URL || "https://horizon-testnet.stellar.org";
    this.server = new StellarSdk.Horizon.Server(networkUrl);
    const secret = process.env.STELLAR_STORAGE_SECRET || "SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    try {
      this.sourceKeypair = StellarSdk.Keypair.fromSecret(secret);
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
      const asset = assetCode && assetIssuer ? new StellarSdk.Asset(assetCode, assetIssuer) : StellarSdk.Asset.native();
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: process.env.STELLAR_NETWORK_URL?.includes("public") ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET
      }).addOperation(
        StellarSdk.Operation.payment({
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
  async checkTrustline(destination, assetCode, assetIssuer) {
    const account = await this.server.loadAccount(destination);
    return account.balances.some(
      (balance) => balance.asset_code === assetCode && balance.asset_issuer === assetIssuer
    );
  }
  async createAssetPayment(params) {
    const { destination, assetCode, assetIssuer, amount } = params;
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
      throw new Error(`Invalid destination address: ${destination}`);
    }
    const hasTrustline = await this.checkTrustline(destination, assetCode, assetIssuer);
    if (!hasTrustline) {
      throw new Error(
        `Destination account ${destination} does not have a trustline for ${assetCode}:${assetIssuer}`
      );
    }
    const transactionHash = await this.sendFunds(destination, amount, assetCode, assetIssuer);
    return {
      transactionHash,
      assetCode,
      assetIssuer,
      amount,
      destination
    };
  }
  async verifyPayment(params) {
    const { txHash, expectedDestination, expectedAmount, expectedAssetCode, expectedAssetIssuer } = params;
    try {
      const transaction = await this.server.transactions().transaction(txHash).call();
      const operations = await this.server.operations().forTransaction(txHash).call();
      const paymentOp = operations.records.find(
        (op) => op.type === "payment" || op.type === "path_payment_strict_receive" || op.type === "path_payment_strict_send"
      );
      if (!paymentOp) {
        return {
          verified: false,
          amount: "",
          asset: "",
          source: transaction.source_account,
          memo: typeof transaction.memo === "string" ? transaction.memo : null,
          timestamp: transaction.created_at
        };
      }
      const paymentAssetCode = paymentOp.asset_code || "XLM";
      const paymentAssetIssuer = paymentOp.asset_issuer;
      const asset = paymentAssetCode + (paymentAssetIssuer ? `:${paymentAssetIssuer}` : "");
      const destinationMatch = paymentOp.to === expectedDestination;
      const amountMatch = paymentOp.amount === expectedAmount;
      const assetCodeMatch = !expectedAssetCode || paymentAssetCode === expectedAssetCode;
      const assetIssuerMatch = !expectedAssetIssuer || paymentAssetIssuer === expectedAssetIssuer;
      return {
        verified: destinationMatch && amountMatch && assetCodeMatch && assetIssuerMatch,
        amount: paymentOp.amount,
        asset,
        source: paymentOp.from,
        memo: typeof transaction.memo === "string" ? transaction.memo : null,
        timestamp: transaction.created_at
      };
    } catch (error) {
      console.error("Failed to verify payment:", error);
      throw error;
    }
  }
  async createReceivePayment(params) {
    const { address, timeoutMs = 3e4, assetCode, assetIssuer, from } = params;
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
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

// src/index.ts
var stellarService = new StellarService();
function createTransactionBuilder(source, server) {
  const networkPassphrase = server.networkPassphrase || "";
  return new TransactionBuilder2(source, {
    fee: BASE_FEE2,
    // FIX: Use the imported root BASE_FEE constant directly
    networkPassphrase
  });
}
async function sendStellarPayment(to, amount, asset) {
  return stellarService.sendFunds(to, amount.toString(), asset === "XLM" ? void 0 : asset);
}
export {
  createTransactionBuilder,
// src/payment-channel.ts
import * as StellarSdk2 from "stellar-sdk";
async function createPaymentChannel(config) {
  const { id, asset, distributions, signers, networkPassphrase, fee, signatureThreshold } = config;
  if (!id) {
    throw new Error("Payment channel id is required");
  }
  if (!signers.length) {
    throw new Error("At least one signer is required");
  }
  if (!distributions.length) {
    throw new Error("At least one distribution is required");
  }
  for (const signer of signers) {
    if (!StellarSdk2.StrKey.isValidEd25519PublicKey(signer.publicKey)) {
      throw new Error(`Invalid signer public key: ${signer.publicKey}`);
    }
  }
  for (const distribution of distributions) {
    if (!StellarSdk2.StrKey.isValidEd25519PublicKey(distribution.publicKey)) {
      throw new Error(`Invalid distribution address: ${distribution.publicKey}`);
    }
    if (!distribution.amount || Number(distribution.amount) <= 0) {
      throw new Error(`Invalid distribution amount for ${distribution.publicKey}`);
    }
  }
  const escrowKeypair = StellarSdk2.Keypair.random();
  const channel = {
    id,
    escrowAccountId: escrowKeypair.publicKey(),
    status: "open",
    asset,
    distributions,
    signers,
    networkPassphrase,
    fee,
    signatureThreshold
  };
  return channel;
}
function resolveAsset(asset) {
  const code = asset.code?.trim();
  const isNative = !code || code === "native" || code === "XLM";
  if (isNative) {
    if (asset.issuer) {
      throw new Error("Native asset cannot include an issuer");
    }
    return StellarSdk2.Asset.native();
  }
  if (!asset.issuer) {
    throw new Error(`Issuer is required for asset ${code}`);
  }
  return new StellarSdk2.Asset(code, asset.issuer);
}
function normalizeFee(fee) {
  const feeValue = fee === void 0 ? Number(StellarSdk2.BASE_FEE) : Number(fee);
  if (!Number.isFinite(feeValue) || feeValue <= 0) {
    throw new Error(`Invalid fee: ${String(fee)}`);
  }
  return String(Math.trunc(feeValue));
}
function assertChannelReadyToClose(channel) {
  if (channel.status === "closed") {
    throw new Error(`Payment channel ${channel.id} is already closed`);
  }
  if (!channel.distributions.length) {
    throw new Error("Payment channel close requires at least one distribution");
  }
  if (!channel.signers.length) {
    throw new Error("Payment channel close requires at least one signer");
  }
  for (const distribution of channel.distributions) {
    if (!StellarSdk2.StrKey.isValidEd25519PublicKey(distribution.publicKey)) {
      throw new Error(`Invalid distribution address: ${distribution.publicKey}`);
    }
    if (!distribution.amount || Number(distribution.amount) <= 0) {
      throw new Error(`Invalid distribution amount for ${distribution.publicKey}`);
    }
  }
}
function collectSignerKeypairs(channel) {
  const threshold = channel.signatureThreshold ?? channel.signers.length;
  const keypairs = channel.signers.map((signer) => signer.keypair).filter((keypair) => Boolean(keypair));
  if (keypairs.length < threshold) {
    throw new Error(
      `Insufficient multi-party signoffs: ${keypairs.length}/${threshold} signatures available`
    );
  }
  const unmatchedSigner = channel.signers.find(
    (signer) => signer.keypair && signer.keypair.publicKey() !== signer.publicKey
  );
  if (unmatchedSigner) {
    throw new Error(
      `Signer keypair does not match configured public key: ${unmatchedSigner.publicKey}`
    );
  }
  return keypairs.slice(0, threshold);
}
function buildChannelCloseTransaction(channel, sourceAccount) {
  assertChannelReadyToClose(channel);
  const account = sourceAccount instanceof StellarSdk2.Account ? sourceAccount : new StellarSdk2.Account(sourceAccount.account_id, sourceAccount.sequence);
  const asset = resolveAsset(channel.asset);
  const fee = normalizeFee(channel.fee);
  let builder = new StellarSdk2.TransactionBuilder(account, {
    fee,
    networkPassphrase: channel.networkPassphrase
  });
  for (const distribution of channel.distributions) {
    builder = builder.addOperation(
      StellarSdk2.Operation.payment({
        destination: distribution.publicKey,
        asset,
        amount: distribution.amount
      })
    );
  }
  return builder.setTimeout(30).build();
}
async function closePaymentChannel(channel, server) {
  assertChannelReadyToClose(channel);
  const signerKeypairs = collectSignerKeypairs(channel);
  const escrowAccount = await server.loadAccount(channel.escrowAccountId);
  const transaction = buildChannelCloseTransaction(channel, escrowAccount);
  for (const keypair of signerKeypairs) {
    transaction.sign(keypair);
  }
  const response = await server.submitTransaction(transaction);
  return {
    channelId: channel.id,
    status: "closed",
    transactionHash: response.hash,
    escrowAccountId: channel.escrowAccountId,
    distributions: channel.distributions.map((distribution) => ({ ...distribution })),
    closedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/transaction.ts
function buildSignedTransaction(builder, keypair) {
  const transaction = builder.build();
  if (!transaction.operations.length) {
    throw new Error("Transaction must contain at least one operation");
  }
  transaction.sign(keypair);
  return transaction;
}

// src/index.ts
var stellarService = new StellarService();
async function sendStellarPayment(to, amount, asset) {
  return stellarService.sendFunds(to, amount.toString(), asset === "XLM" ? void 0 : asset);
}
async function createAssetPayment(params) {
  return stellarService.createAssetPayment(params);
}
export {
  StellarService,
  buildChannelCloseTransaction,
  buildSignedTransaction,
  closePaymentChannel,
  createAssetPayment,
  createPaymentChannel,
  sendStellarPayment
};
