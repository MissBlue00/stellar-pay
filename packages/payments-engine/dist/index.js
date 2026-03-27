"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  InMemoryMintAuditStore: () => InMemoryMintAuditStore,
  SorobanMirrorAssetMintingService: () => SorobanMirrorAssetMintingService
});
module.exports = __toCommonJS(index_exports);

// src/audit-store.ts
var InMemoryMintAuditStore = class {
  records = /* @__PURE__ */ new Map();
  async save(record) {
    this.records.set(record.paymentId, record);
  }
  async getByPaymentId(paymentId) {
    return this.records.get(paymentId) ?? null;
  }
};

// src/soroban-mirror-asset-minting.service.ts
var import_stellar_sdk = require("stellar-sdk");
var DEFAULT_SEND_TIMEOUT_MS = 3e4;
var DEFAULT_POLL_INTERVAL_MS = 1500;
var SorobanMirrorAssetMintingService = class {
  constructor(config, auditStore = new InMemoryMintAuditStore()) {
    this.auditStore = auditStore;
    this.rpc = new import_stellar_sdk.rpc.Server(config.rpcUrl);
    this.treasuryKeypair = import_stellar_sdk.Keypair.fromSecret(config.treasuryPrivateKey);
    this.contractId = config.contractId;
    this.networkPassphrase = config.networkPassphrase ?? import_stellar_sdk.Networks.TESTNET;
    this.sendTimeoutMs = config.sendTimeoutMs ?? DEFAULT_SEND_TIMEOUT_MS;
  }
  rpc;
  treasuryKeypair;
  contractId;
  networkPassphrase;
  sendTimeoutMs;
  async mintMirrorAsset(input) {
    const sourceAccount = await this.rpc.getAccount(this.treasuryKeypair.publicKey());
    const contract = new import_stellar_sdk.Contract(this.contractId);
    const operation = contract.call(
      "mint",
      import_stellar_sdk.Address.fromString(input.merchantAddress).toScVal(),
      (0, import_stellar_sdk.nativeToScVal)(input.assetSymbol, { type: "symbol" }),
      (0, import_stellar_sdk.nativeToScVal)(input.amount, { type: "i128" })
    );
    const transaction = new import_stellar_sdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase: this.networkPassphrase
    }).addOperation(operation).setTimeout(30).build();
    const prepared = await this.rpc.prepareTransaction(transaction);
    prepared.sign(this.treasuryKeypair);
    const sendResponse = await this.rpc.sendTransaction(prepared);
    if (sendResponse.errorResult) {
      throw new Error(
        `Soroban transaction failed before submission: ${sendResponse.errorResult.toXDR("base64")}`
      );
    }
    if (!sendResponse.hash) {
      throw new Error("Soroban transaction did not return a hash.");
    }
    await this.waitForSuccess(sendResponse.hash);
    const auditRecord = {
      paymentId: input.paymentId,
      merchantAddress: input.merchantAddress,
      assetSymbol: input.assetSymbol,
      amount: input.amount,
      transactionHash: sendResponse.hash,
      mintedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.auditStore.save(auditRecord);
    return {
      transactionHash: sendResponse.hash
    };
  }
  getAuditRecord(paymentId) {
    return this.auditStore.getByPaymentId(paymentId);
  }
  async waitForSuccess(transactionHash) {
    const start = Date.now();
    for (; ; ) {
      const transactionResponse = await this.rpc.getTransaction(transactionHash);
      if (transactionResponse.status === import_stellar_sdk.rpc.Api.GetTransactionStatus.SUCCESS) {
        return;
      }
      if (transactionResponse.status === import_stellar_sdk.rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Soroban transaction failed on-chain: ${transactionHash}`);
      }
      if (Date.now() - start > this.sendTimeoutMs) {
        throw new Error(`Timed out waiting for Soroban transaction: ${transactionHash}`);
      }
      await this.sleep(DEFAULT_POLL_INTERVAL_MS);
    }
  }
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InMemoryMintAuditStore,
  SorobanMirrorAssetMintingService
});
