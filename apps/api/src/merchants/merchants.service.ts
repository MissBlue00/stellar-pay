import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MerchantRecord } from './interfaces/merchant-record.interface';

@Injectable()
export class MerchantsService {
  private readonly byId = new Map<string, MerchantRecord>();
  private readonly byEmail = new Map<string, MerchantRecord>();

  async create(email: string, passwordHash: string, name: string): Promise<MerchantRecord> {
    const normalized = email.toLowerCase().trim();
    if (this.byEmail.has(normalized)) {
      throw new ConflictException('Email already registered');
    }
    const id = randomUUID();
    const record: MerchantRecord = {
      id,
      email: normalized,
      passwordHash,
      name: name.trim(),
      createdAt: new Date(),
    };
    this.byId.set(id, record);
    this.byEmail.set(normalized, record);
    return record;
  }

  async findByEmail(email: string): Promise<MerchantRecord | null> {
    const normalized = email.toLowerCase().trim();
    return this.byEmail.get(normalized) ?? null;
  }

  async findById(id: string): Promise<MerchantRecord | null> {
    return this.byId.get(id) ?? null;
  }

  toPublicProfile(record: MerchantRecord): { id: string; email: string; name: string } {
    return {
      id: record.id,
      email: record.email,
      name: record.name,
    };
  }
}
