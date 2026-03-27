import { IsEnum, IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Currency } from '../enums/currency.enum.js';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0.01, { message: 'amount must be at least 0.01' })
  @Type(() => Number)
  amount!: number;

  @IsEnum(Currency, {
    message: `currency must be one of: ${Object.values(Currency).join(', ')}`,
  })
  currency!: Currency;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
