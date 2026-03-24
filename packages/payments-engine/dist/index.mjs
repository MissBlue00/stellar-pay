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
import {
  Address,
  Contract,
  Keypair,
  Networks,
  rpc as SorobanRpc,
  TransactionBuilder,
  nativeToScVal
} from "stellar-sdk";
var DEFAULT_SEND_TIMEOUT_MS = 3e4;
var DEFAULT_POLL_INTERVAL_MS = 1500;
var SorobanMirrorAssetMintingService = class {
  constructor(config, auditStore = new InMemoryMintAuditStore()) {
    this.auditStore = auditStore;
    this.rpc = new SorobanRpc.Server(config.rpcUrl);
    this.treasuryKeypair = Keypair.fromSecret(config.treasuryPrivateKey);
    this.contractId = config.contractId;
    this.networkPassphrase = config.networkPassphrase ?? Networks.TESTNET;
    this.sendTimeoutMs = config.sendTimeoutMs ?? DEFAULT_SEND_TIMEOUT_MS;
  }
  rpc;
  treasuryKeypair;
  contractId;
  networkPassphrase;
  sendTimeoutMs;
  async mintMirrorAsset(input) {
    const sourceAccount = await this.rpc.getAccount(this.treasuryKeypair.publicKey());
    const contract = new Contract(this.contractId);
    const operation = contract.call(
      "mint",
      Address.fromString(input.merchantAddress).toScVal(),
      nativeToScVal(input.assetSymbol, { type: "symbol" }),
      nativeToScVal(input.amount, { type: "i128" })
    );
    const transaction = new TransactionBuilder(sourceAccount, {
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
      if (transactionResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        return;
      }
      if (transactionResponse.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
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
export {
  InMemoryMintAuditStore,
  SorobanMirrorAssetMintingService
};
