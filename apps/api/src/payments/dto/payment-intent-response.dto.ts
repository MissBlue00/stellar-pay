import { Expose } from 'class-transformer';

export class PaymentIntentResponseDto {
  @Expose()
  payment_id: string;

  @Expose()
  payment_reference: string;

  @Expose()
  checkout_url: string;

  @Expose()
  amount: number;

  @Expose()
  asset: string;

  @Expose()
  status: string;

  @Expose()
  created_at: Date;

  @Expose()
  merchant_id: string;
}
