import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the payment intent',
    example: 'pay_a1b2c3d4e5f6',
  })
  payment_id: string;

  @ApiProperty({
    description: 'Unique reference generated for the payment',
    example: 'ref_9k2j3n4k5j6h',
  })
  payment_reference: string;

  @ApiProperty({
    description: 'Stellar Pay hosted checkout URL for the merchant customer',
    example: 'https://checkout.stellar-pay.com/pay/pay_a1b2c3d4e5f6',
  })
  checkout_url: string;
}
