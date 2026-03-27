import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Chain } from './enums/chain.enum';
import { type DepositAddress } from './interfaces/deposit-address.interface';
import { type GenerateDepositAddressDto } from './dto/generate-deposit-address.dto';
import { StellarWalletService } from './wallet/stellar.wallet.service';
import { EthereumWalletService } from './wallet/ethereum.wallet.service';
import { BitcoinWalletService } from './wallet/bitcoin.wallet.service';

@Injectable()
export class DepositAddressService {
  private readonly logger = new Logger(DepositAddressService.name);

  private readonly store = new Map<string, DepositAddress>();

  private derivationCounter = 0;

  constructor(
    private readonly stellarWallet: StellarWalletService,
    private readonly ethereumWallet: EthereumWalletService,
    private readonly bitcoinWallet: BitcoinWalletService,
  ) {}

  generate(paymentIntentId: string, dto: GenerateDepositAddressDto): DepositAddress {
    const storeKey = `${paymentIntentId}:${dto.chain}`;

    const existing = this.store.get(storeKey);
    if (existing) {
      return existing;
    }

    const masterSeed = process.env.HD_MASTER_SEED;
    if (!masterSeed) {
      throw new Error('HD_MASTER_SEED environment variable is not set');
    }

    const derivationIndex = this.derivationCounter++;
    const address = this.deriveAddress(dto.chain, masterSeed, derivationIndex);

    const depositAddress: DepositAddress = {
      id: crypto.randomUUID(),
      paymentIntentId,
      chain: dto.chain,
      address: address.address,
      memo: address.memo,
      derivationIndex,
      expiresAt: dto.expiresAt,
      createdAt: new Date().toISOString(),
    };

    this.store.set(storeKey, depositAddress);
    this.logger.log(`Generated ${dto.chain} deposit address for intent ${paymentIntentId}`);

    return depositAddress;
  }

  findByIntentAndChain(paymentIntentId: string, chain: Chain): DepositAddress {
    const storeKey = `${paymentIntentId}:${chain}`;
    const found = this.store.get(storeKey);

    if (!found) {
      throw new NotFoundException(
        `No ${chain} deposit address found for payment intent ${paymentIntentId}`,
      );
    }

    return found;
  }

  findAllByIntent(paymentIntentId: string): DepositAddress[] {
    return [...this.store.values()].filter((d) => d.paymentIntentId === paymentIntentId);
  }

  private deriveAddress(
    chain: Chain,
    masterSeed: string,
    index: number,
  ): { address: string; memo?: string } {
    switch (chain) {
      case Chain.STELLAR: {
        return this.stellarWallet.deriveAddress(masterSeed, index);
      }
      case Chain.ETHEREUM: {
        return { address: this.ethereumWallet.deriveAddress(masterSeed, index) };
      }
      case Chain.BITCOIN: {
        return { address: this.bitcoinWallet.deriveAddress(masterSeed, index) };
      }
      default: {
        const _exhaustive: never = chain;
        throw new Error(`Unsupported chain: ${String(_exhaustive)}`);
      }
    }
  }
}
