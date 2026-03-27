import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { Keypair } from '@stellar/stellar-sdk';

const SLIP10_SEED = Buffer.from('ed25519 seed', 'utf8');

@Injectable()
export class StellarWalletService {
  deriveAddress(masterSeedHex: string, derivationIndex: number): { address: string; memo: string } {
    const masterSeed = Buffer.from(masterSeedHex, 'hex');

    const masterHmac = createHmac('sha512', SLIP10_SEED).update(masterSeed).digest();
    let keyBuffer = masterHmac.subarray(0, 32);
    let chainCode = masterHmac.subarray(32);

    const pathIndices = [0x80000000 + 44, 0x80000000 + 148, 0x80000000 + derivationIndex];

    for (const childIndex of pathIndices) {
      const data = Buffer.alloc(37);
      data[0] = 0x00;
      keyBuffer.copy(data, 1);
      data.writeUInt32BE(childIndex, 33);

      const childHmac = createHmac('sha512', chainCode).update(data).digest();
      keyBuffer = childHmac.subarray(0, 32);
      chainCode = childHmac.subarray(32);
    }

    const keypair = Keypair.fromRawEd25519Seed(keyBuffer);

    return {
      address: keypair.publicKey(),
      memo: String(derivationIndex),
    };
  }
}
