import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { Chain } from '../enums/chain.enum';

export class GenerateDepositAddressDto {
  @IsEnum(Chain, {
    message: `chain must be one of: ${Object.values(Chain).join(', ')}`,
  })
  chain!: Chain;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
