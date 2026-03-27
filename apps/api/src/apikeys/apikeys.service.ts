import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ApiKeyRecord {
  id: string;
  merchantId: string;
  key_hash: string;
  createdAt: Date;
}

@Injectable()
export class ApikeysService {
  // TODO: Replace with actual database interaction
  private readonly database: ApiKeyRecord[] = [];

  async generateApiKey(merchantId: string): Promise<{ plaintextKey: string }> {
    // Generate 32-byte cryptographically random key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const plaintextKey = `sp_live_${rawKey}`;

    // Store only the SHA256 hash of the key in the database (key_hash)
    const key_hash = crypto.createHash('sha256').update(plaintextKey).digest('hex');

    const record: ApiKeyRecord = {
      id: crypto.randomUUID(),
      merchantId,
      key_hash,
      createdAt: new Date(),
    };

    this.database.push(record);

    // Response: Return the plaintext key only once to the merchant
    return { plaintextKey };
  }
}
