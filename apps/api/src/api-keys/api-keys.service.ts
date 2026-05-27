import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from './prisma.service.js';

export interface CreateApiKeyResult {
  key: string;
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async createApiKey(merchantId: string): Promise<CreateApiKeyResult> {
    const key = `sp_live_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(key).digest('hex');
    const id = randomUUID();
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO "ApiKey" ("id", "merchantId", "key_hash", "createdAt", "updatedAt")
      VALUES (${id}, ${merchantId}, ${keyHash}, ${now}, ${now})
    `;

    return { key };
  }
}
