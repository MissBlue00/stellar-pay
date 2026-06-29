import { IsArray, IsBoolean, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { WebhookEventType } from '../interfaces/webhook-event.interface';

export class CreateWebhookDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events!: WebhookEventType[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
