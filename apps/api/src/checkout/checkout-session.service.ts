import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CheckoutSessionEntity } from './entities/checkout-session.entity';

export interface CreateCheckoutSessionDto {
  merchant_id: string;
  payment_method: string;
  amount: number;
  currency: string;
  description: string;
  merchant_name: string;
  return_url?: string;
  webhook_url?: string;
  metadata?: Record<string, string | number | boolean | Date | null>;
  expires_in_minutes?: number;
}

export interface CheckoutSessionResponseDto {
  id: string;
  session_token: string;
  payment_method: string;
  amount: number;
  currency: string;
  description: string;
  merchant_name: string;
  return_url?: string | null;
  status: string;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class CheckoutSessionService {
  constructor(
    @InjectRepository(CheckoutSessionEntity)
    private readonly sessionRepository: Repository<CheckoutSessionEntity>,
  ) {}

  async createSession(createDto: CreateCheckoutSessionDto): Promise<CheckoutSessionEntity> {
    const expiresInMinutes = createDto.expires_in_minutes || 15;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const sessionToken = uuidv4();

    const session = this.sessionRepository.create({
      merchant_id: createDto.merchant_id,
      session_token: sessionToken,
      payment_method: createDto.payment_method,
      amount: createDto.amount,
      currency: createDto.currency,
      description: createDto.description,
      merchant_name: createDto.merchant_name,
      return_url: createDto.return_url,
      webhook_url: createDto.webhook_url,
      expires_at: expiresAt,
      status: 'pending',
      metadata: createDto.metadata,
    });

    return this.sessionRepository.save(session);
  }

  async getSessionByToken(token: string): Promise<CheckoutSessionEntity> {
    const session = await this.sessionRepository.findOne({
      where: { session_token: token },
    });

    if (!session) {
      throw new NotFoundException(`Checkout session with token ${token} not found`);
    }

    // Check if session has expired
    if (new Date() > session.expires_at) {
      session.status = 'expired';
      await this.sessionRepository.save(session);
      throw new BadRequestException('Checkout session has expired');
    }

    return session;
  }

  async getSessionById(id: string): Promise<CheckoutSessionEntity> {
    const session = await this.sessionRepository.findOne({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Checkout session ${id} not found`);
    }

    return session;
  }

  async updateSessionStatus(
    id: string,
    status: 'pending' | 'completed' | 'expired' | 'cancelled',
  ): Promise<CheckoutSessionEntity> {
    const session = await this.getSessionById(id);
    session.status = status;
    return this.sessionRepository.save(session);
  }

  async cleanupExpiredSessions(): Promise<number> {
    const currentDate = new Date();
    const result = await this.sessionRepository
      .createQueryBuilder()
      .update(CheckoutSessionEntity)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'pending' })
      .andWhere('expires_at < :now', { now: currentDate })
      .execute();

    return result.affected || 0;
  }

  async toResponseDto(session: CheckoutSessionEntity): Promise<CheckoutSessionResponseDto> {
    return {
      id: session.id,
      session_token: session.session_token,
      payment_method: session.payment_method,
      amount: session.amount,
      currency: session.currency,
      description: session.description,
      merchant_name: session.merchant_name,
      return_url: session.return_url,
      status: session.status,
      expires_at: session.expires_at,
      created_at: session.created_at,
    };
  }
}
