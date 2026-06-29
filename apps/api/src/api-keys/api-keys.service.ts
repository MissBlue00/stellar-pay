import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateApiKeyResponse {
  id: string;
  api_key: string;
  prefix: string;
  created_at: string;
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async generateKey(merchantId: string): Promise<CreateApiKeyResponse> {
    const raw = randomBytes(32).toString('hex');
    const prefix = 'sp_live_';
    const plaintext = `${prefix}${raw}`;
    const keyHash = createHash('sha256').update(plaintext).digest('hex');

    try {
      const record = await this.prisma.apiKey.create({
        data: {
          merchantId,
          keyHash,
          prefix,
        },
      });

      return {
        id: record.id,
        api_key: plaintext,
        prefix: record.prefix,
        created_at: record.createdAt.toISOString(),
      };
    } catch (error) {
      if ((error as Record<string, unknown>)?.code === 'P2002') {
        throw new ConflictException('API key already exists');
      }
      throw new InternalServerErrorException('Failed to generate API key');
    }
  }
}
