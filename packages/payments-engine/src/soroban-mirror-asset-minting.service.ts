import {
  Address,
  Contract,
  Keypair,
  Networks,
  rpc as SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
} from 'stellar-sdk';
import { InMemoryMintAuditStore, MintAuditStore, StellarMintAuditRecord } from './audit-store';

const DEFAULT_SEND_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 1_500;

export interface SorobanMintingConfig {
  rpcUrl: string;
  networkPassphrase?: string;
  contractId: string;
  treasuryPrivateKey: string;
  sendTimeoutMs?: number;
}

export interface MintMirrorAssetInput {
  paymentId: string;
  merchantAddress: string;
  assetSymbol: string;
  amount: string;
}

export interface MintMirrorAssetResult {
  transactionHash: string;
}

export class SorobanMirrorAssetMintingService {
  private readonly rpc: SorobanRpc.Server;
  private readonly treasuryKeypair: Keypair;
  private readonly contractId: string;
  private readonly networkPassphrase: string;
  private readonly sendTimeoutMs: number;

  constructor(
    config: SorobanMintingConfig,
    private readonly auditStore: MintAuditStore = new InMemoryMintAuditStore(),
  ) {
    this.rpc = new SorobanRpc.Server(config.rpcUrl);
    this.treasuryKeypair = Keypair.fromSecret(config.treasuryPrivateKey);
    this.contractId = config.contractId;
    this.networkPassphrase = config.networkPassphrase ?? Networks.TESTNET;
    this.sendTimeoutMs = config.sendTimeoutMs ?? DEFAULT_SEND_TIMEOUT_MS;
  }

  async mintMirrorAsset(input: MintMirrorAssetInput): Promise<MintMirrorAssetResult> {
    const sourceAccount = await this.rpc.getAccount(this.treasuryKeypair.publicKey());
    const contract = new Contract(this.contractId);
    const operation = contract.call(
      'mint',
      Address.fromString(input.merchantAddress).toScVal(),
      nativeToScVal(input.assetSymbol, { type: 'symbol' }),
      nativeToScVal(input.amount, { type: 'i128' }),
    );

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '100000',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const prepared = await this.rpc.prepareTransaction(transaction);
    prepared.sign(this.treasuryKeypair);

    const sendResponse = await this.rpc.sendTransaction(prepared);
    if (sendResponse.errorResult) {
      throw new Error(
        `Soroban transaction failed before submission: ${sendResponse.errorResult.toXDR('base64')}`,
      );
    }

    if (!sendResponse.hash) {
      throw new Error('Soroban transaction did not return a hash.');
    }

    await this.waitForSuccess(sendResponse.hash);

    const auditRecord: StellarMintAuditRecord = {
      paymentId: input.paymentId,
      merchantAddress: input.merchantAddress,
      assetSymbol: input.assetSymbol,
      amount: input.amount,
      transactionHash: sendResponse.hash,
      mintedAt: new Date().toISOString(),
    };
    await this.auditStore.save(auditRecord);

    return {
      transactionHash: sendResponse.hash,
    };
  }

  getAuditRecord(paymentId: string): Promise<StellarMintAuditRecord | null> {
    return this.auditStore.getByPaymentId(paymentId);
  }

  private async waitForSuccess(transactionHash: string): Promise<void> {
    const start = Date.now();

    for (;;) {
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
