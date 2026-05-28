import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateWebhookEndpointDto {
  @IsString()
  @IsNotEmpty()
  merchantId: string;

  @IsUrl({ require_tld: false })
  url: string;

  @IsString()
  @IsNotEmpty()
  secret: string;
}
