import { Injectable } from '@nestjs/common';
import {
  InMemoryMintAuditStore,
  MintAuditStore,
  SorobanMirrorAssetMintingService,
} from '@stellar-pay/payments-engine';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly auditStore: MintAuditStore = new InMemoryMintAuditStore();
  private readonly mintingService: SorobanMirrorAssetMintingService;

  constructor() {
    const contractId = process.env.SOROBAN_MIRROR_ASSET_CONTRACT_ID;
    const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!contractId) {
      throw new Error('Missing SOROBAN_MIRROR_ASSET_CONTRACT_ID environment variable.');
    }
    if (!treasuryPrivateKey) {
      throw new Error('Missing TREASURY_PRIVATE_KEY environment variable.');
    }

    this.mintingService = new SorobanMirrorAssetMintingService(
      {
        rpcUrl: process.env.STELLAR_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
        networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE,
        contractId,
        treasuryPrivateKey,
      },
      this.auditStore,
    );
  }

  async confirmPayment(dto: ConfirmPaymentDto): Promise<{ transactionHash: string }> {
    return this.mintingService.mintMirrorAsset({
      paymentId: dto.paymentId,
      merchantAddress: dto.merchantAddress,
      assetSymbol: dto.assetSymbol,
      amount: dto.amount,
    });
  }

  getAuditRecord(paymentId: string) {
    return this.mintingService.getAuditRecord(paymentId);
  }
}
