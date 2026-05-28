import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'The amount of the payment',
    example: 100.0,
  })
  amount: number;

  @ApiProperty({
    description: 'The currency of the payment (e.g. USD, XLM)',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'The Stellar destination address for the payment',
    example: 'GDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    required: false,
  })
  destination?: string;

  @ApiProperty({
    description: 'Description of the payment intent',
    example: 'Invoice #1043 payment',
    required: false,
  })
  description?: string;
}
