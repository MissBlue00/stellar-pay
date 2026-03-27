import { Injectable } from '@nestjs/common';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const bip32 = BIP32Factory(ecc);

@Injectable()
export class BitcoinWalletService {
  deriveAddress(masterSeedHex: string, derivationIndex: number): string {
    const masterSeed = Buffer.from(masterSeedHex, 'hex');
    const derivationPath = `m/44'/0'/0'/0/${derivationIndex}`;
    const root = bip32.fromSeed(masterSeed);
    const child = root.derivePath(derivationPath);

    const { address } = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(child.publicKey),
      network: bitcoin.networks.bitcoin,
    });

    if (!address) {
      throw new Error(`Failed to derive Bitcoin address at index ${derivationIndex}`);
    }

    return address;
  }
}
