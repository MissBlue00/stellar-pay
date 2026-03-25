import { IsString, IsNumber, IsPositive, IsOptional, IsEnum } from 'class-validator';

export enum PaymentAsset {
  USDC = 'USDC',
  ARS = 'ARS',
  BRL = 'BRL',
  COP = 'COP',
  MXN = 'MXN',
  XLM = 'XLM',
}

export class CreatePaymentIntentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(PaymentAsset)
  asset: PaymentAsset;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  metadata?: string;
}
