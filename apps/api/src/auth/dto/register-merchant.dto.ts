import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterMerchantDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name?: string;
}
