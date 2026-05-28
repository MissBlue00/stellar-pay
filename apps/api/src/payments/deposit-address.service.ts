import { Injectable, Logger } from '@nestjs/common';
import { DepositAddress, DepositNetwork } from './interfaces/deposit-address.interface';

@Injectable()
export class DepositAddressService {
  private readonly logger = new Logger(DepositAddressService.name);
  private readonly addresses = new Map<string, DepositAddress>();

  private sharedStellarAddress: string;
  private btcXpub: string;
  private ethXpub: string;

  constructor() {
    this.sharedStellarAddress =
      process.env.STELLAR_DEPOSIT_ADDRESS ??
      'GAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    this.btcXpub = process.env.BTC_XPUB ?? 'xpub6XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    this.ethXpub = process.env.ETH_XPUB ?? 'xpub6XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  }

  async generateAddress(paymentId: string, network: DepositNetwork): Promise<DepositAddress> {
    const existing = Array.from(this.addresses.values()).find(
      (a) => a.paymentId === paymentId && a.network === network,
    );
    if (existing) return existing;

    const id = `da_${crypto.randomUUID().split('-').join('').slice(0, 16)}`;

    let address: string;
    let memo: string | undefined;
    let derivationPath: string | undefined;

    switch (network) {
      case DepositNetwork.STELLAR:
        address = this.sharedStellarAddress;
        memo = crypto.randomUUID().split('-').join('').slice(0, 16).toUpperCase();
        derivationPath = `memo:${memo}`;
        break;

      case DepositNetwork.BTC: {
        const index = this.getNextDerivationIndex(network);
        derivationPath = `m/84'/0'/0'/0/${index}`;
        // TODO: Derive actual BTC address from xpub using bip32
        // const key = BIP32.fromBase58(this.btcXpub).derivePath(derivationPath);
        // address = bitcoin.payments.p2wpkh({ pubkey: key.publicKey }).address!;
        address = `bc1q${crypto.randomUUID().split('-').join('').slice(0, 32).toLowerCase()}`;
        break;
      }

      case DepositNetwork.ETH: {
        const index = this.getNextDerivationIndex(network);
        derivationPath = `m/44'/60'/0'/0/${index}`;
        // TODO: Derive actual ETH address from xpub using ethereumjs-wallet or ethers
        // const wallet = HDKey.fromExtendedKey(this.ethXpub).derive(derivationPath);
        // address = wallet.getAddress().toString('hex');
        address = `0x${crypto.randomUUID().split('-').join('').slice(0, 40).toLowerCase()}`;
        break;
      }
    }

    const depositAddress: DepositAddress = {
      id,
      paymentId,
      network,
      address,
      memo,
      derivationPath,
      createdAt: new Date().toISOString(),
    };

    this.addresses.set(id, depositAddress);
    this.logger.log(`Generated ${network} deposit address ${address} for payment ${paymentId}`);
    return depositAddress;
  }

  getAddressesByPaymentId(paymentId: string): DepositAddress[] {
    return Array.from(this.addresses.values()).filter((a) => a.paymentId === paymentId);
  }

  private readonly derivationCounters: Record<string, number> = {};

  private getNextDerivationIndex(network: DepositNetwork): number {
    this.derivationCounters[network] = (this.derivationCounters[network] ?? -1) + 1;
    return this.derivationCounters[network];
  }
}
