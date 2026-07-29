import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateMerchantProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
