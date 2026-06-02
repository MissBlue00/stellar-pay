import { IsEnum } from 'class-validator';
import { DepositNetwork } from '../interfaces/deposit-address.interface';

export class GenerateDepositAddressDto {
  @IsEnum(DepositNetwork, {
    message: `network must be one of: ${Object.values(DepositNetwork).join(', ')}`,
  })
  network!: DepositNetwork;
}
