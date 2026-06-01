import { IsEmail, IsString } from 'class-validator';

export class LoginMerchantDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
