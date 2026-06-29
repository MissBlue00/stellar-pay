import { Injectable, Logger } from '@nestjs/common';
import BIP32Factory from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import * as tinysecp from 'tiny-secp256k1';
import { computeAddress } from 'ethers';
import { DepositAddress, DepositNetwork } from './interfaces/deposit-address.interface';

const BIP32 = BIP32Factory(tinysecp);

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
        try {
          const masterNode = BIP32.fromBase58(this.btcXpub);
          const derivedKey = masterNode.derivePath(derivationPath);
          const { address: btcAddress } = bitcoin.payments.p2wpkh({
            pubkey: derivedKey.publicKey,
          });
          if (!btcAddress) {
            throw new Error('Failed to generate bech32 address');
          }
          address = btcAddress;
        } catch (error) {
          this.logger.error(`Failed to derive BTC address at path ${derivationPath}`, error);
          throw error;
        }
        break;
      }

      case DepositNetwork.ETH: {
        const index = this.getNextDerivationIndex(network);
        derivationPath = `m/44'/60'/0'/0/${index}`;
        try {
          const masterNode = BIP32.fromBase58(this.ethXpub);
          const derivedKey = masterNode.derivePath(derivationPath);
          const pubkey = derivedKey.publicKey;
          const pubkeyHex = `0x${pubkey.toString('hex')}`;
          // computeAddress accepts a public key (compressed or uncompressed hex)
          const ethAddress = computeAddress(pubkeyHex);
          address = ethAddress;
        } catch (error) {
          this.logger.error(`Failed to derive ETH address at path ${derivationPath}`, error);
          throw error;
        }
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
