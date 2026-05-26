import { IsArray, IsBoolean, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { WebhookEventType } from '../interfaces/webhook-event.interface';

export class UpdateWebhookDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events?: WebhookEventType[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
