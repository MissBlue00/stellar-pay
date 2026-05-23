import { IsNumber, IsEnum, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentCurrency } from './payment-currency.enum';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Payment amount',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Currency for the payment',
    enum: PaymentCurrency,
    example: PaymentCurrency.USDC,
  })
  @IsEnum(PaymentCurrency)
  currency: PaymentCurrency;

  @ApiPropertyOptional({
    description: 'Optional metadata for the payment intent',
    example: { orderId: '12345', customerId: 'cust_67890' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
