import { IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RedeemDto {
  @IsNumber()
  @Min(0.01, { message: 'amount must be at least 0.01' })
  @Type(() => Number)
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  destination!: string;
}
