export interface StellarMintAuditRecord {
  paymentId: string;
  merchantAddress: string;
  assetSymbol: string;
  amount: string;
  transactionHash: string;
  mintedAt: string;
}

export interface MintAuditStore {
  save(record: StellarMintAuditRecord): Promise<void>;
  getByPaymentId(paymentId: string): Promise<StellarMintAuditRecord | null>;
}

export class InMemoryMintAuditStore implements MintAuditStore {
  private readonly records = new Map<string, StellarMintAuditRecord>();

  async save(record: StellarMintAuditRecord): Promise<void> {
    this.records.set(record.paymentId, record);
  }

  async getByPaymentId(paymentId: string): Promise<StellarMintAuditRecord | null> {
    return this.records.get(paymentId) ?? null;
  }
}
