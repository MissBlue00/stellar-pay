"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  sendStellarPayment: () => sendStellarPayment
});
module.exports = __toCommonJS(index_exports);

// src/stellar.service.ts
var StellarSdk = __toESM(require("stellar-sdk"));
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
async function sendStellarPayment(to, amount, asset) {
  return stellarService.sendFunds(to, amount.toString(), asset === "XLM" ? void 0 : asset);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sendStellarPayment
});
