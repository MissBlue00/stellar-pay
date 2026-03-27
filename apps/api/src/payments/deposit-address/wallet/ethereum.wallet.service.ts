import { Injectable } from '@nestjs/common';
import { HDNodeWallet } from 'ethers';

@Injectable()
export class EthereumWalletService {
  deriveAddress(masterSeedHex: string, derivationIndex: number): string {
    const masterSeed = Buffer.from(masterSeedHex, 'hex');
    const derivationPath = `m/44'/60'/0'/0/${derivationIndex}`;
    const wallet = HDNodeWallet.fromSeed(masterSeed).derivePath(derivationPath);
    return wallet.address;
  }
}
