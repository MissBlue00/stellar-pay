import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  WebhookConfig,
  CreateWebhookConfigDto,
  UpdateWebhookConfigDto,
} from './interfaces/webhook-config.interface';
import type {
  WebhookDeliveryAttempt,
  WebhookEventType,
} from './interfaces/webhook-event.interface';

@Injectable()
export class WebhookRepository {
  private readonly configs: WebhookConfig[] = [];
  private readonly deliveryAttempts: WebhookDeliveryAttempt[] = [];

  createConfig(merchantId: string, dto: CreateWebhookConfigDto): WebhookConfig {
    const config: WebhookConfig = {
      id: crypto.randomUUID(),
      merchant_id: merchantId,
      url: dto.url,
      secret: this.generateSecret(),
      events: dto.events,
      enabled: dto.enabled ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.configs.push(config);
    return config;
  }

  findByMerchant(merchantId: string): WebhookConfig[] {
    return this.configs.filter((config) => config.merchant_id === merchantId);
  }

  findById(id: string): WebhookConfig | undefined {
    return this.configs.find((config) => config.id === id);
  }

  updateConfig(id: string, dto: UpdateWebhookConfigDto): WebhookConfig | undefined {
    const config = this.configs.find((c) => c.id === id);
    if (!config) return undefined;

    if (dto.url !== undefined) config.url = dto.url;
    if (dto.events !== undefined) config.events = dto.events;
    if (dto.enabled !== undefined) config.enabled = dto.enabled;
    config.updated_at = new Date().toISOString();

    return config;
  }

  deleteConfig(id: string): boolean {
    const index = this.configs.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.configs.splice(index, 1);
    return true;
  }

  findActiveConfigsByEvent(merchantId: string, eventType: WebhookEventType): WebhookConfig[] {
    return this.configs.filter(
      (config) =>
        config.merchant_id === merchantId && config.enabled && config.events.includes(eventType),
    );
  }

  saveDeliveryAttempt(attempt: WebhookDeliveryAttempt): void {
    this.deliveryAttempts.push(attempt);
  }

  findDeliveryAttempts(webhookId: string, limit = 50): WebhookDeliveryAttempt[] {
    return this.deliveryAttempts
      .filter((attempt) => attempt.webhook_id === webhookId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }
}
