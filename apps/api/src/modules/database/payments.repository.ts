import { Injectable } from '@nestjs/common';

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface PaymentIntent {
  payment_id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_reference: string;
  checkout_url: string;
  destination?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PaymentsRepository {
  private paymentIntents: PaymentIntent[] = [];

  async create(data: Omit<PaymentIntent, 'createdAt' | 'updatedAt'>): Promise<PaymentIntent> {
    const record: PaymentIntent = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentIntents.push(record);
    return record;
  }

  async findById(payment_id: string): Promise<PaymentIntent | undefined> {
    return this.paymentIntents.find((p) => p.payment_id === payment_id);
  }

  async findByReference(payment_reference: string): Promise<PaymentIntent | undefined> {
    return this.paymentIntents.find((p) => p.payment_reference === payment_reference);
  }

  async findByMerchant(merchant_id: string): Promise<PaymentIntent[]> {
    return this.paymentIntents.filter((p) => p.merchant_id === merchant_id);
  }
}
