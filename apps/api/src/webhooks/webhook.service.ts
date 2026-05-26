import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { WebhookRepository } from './webhook.repository';
import type { WebhookEventPayload, WebhookEventType, WebhookDeliveryAttempt } from './interfaces/webhook-event.interface';
import type { CreateWebhookConfigDto, UpdateWebhookConfigDto, WebhookConfig } from './interfaces/webhook-config.interface';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 10000; // 10 seconds

  constructor(private readonly webhookRepo: WebhookRepository) {}

  createWebhook(merchantId: string, dto: CreateWebhookConfigDto): WebhookConfig {
    return this.webhookRepo.createConfig(merchantId, dto);
  }

  listWebhooks(merchantId: string): WebhookConfig[] {
    return this.webhookRepo.findByMerchant(merchantId);
  }

  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhookRepo.findById(id);
  }

  updateWebhook(id: string, dto: UpdateWebhookConfigDto): WebhookConfig | undefined {
    return this.webhookRepo.updateConfig(id, dto);
  }

  deleteWebhook(id: string): boolean {
    return this.webhookRepo.deleteConfig(id);
  }

  getDeliveryAttempts(webhookId: string): WebhookDeliveryAttempt[] {
    return this.webhookRepo.findDeliveryAttempts(webhookId);
  }

  async dispatchEvent(
    merchantId: string,
    eventType: WebhookEventType,
    data: Record<string, unknown>,
  ): Promise<void> {
    const payload: WebhookEventPayload = {
      event: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    const configs = this.webhookRepo.findActiveConfigsByEvent(merchantId, eventType);

    if (configs.length === 0) {
      this.logger.debug(`No active webhooks for merchant ${merchantId} and event ${eventType}`);
      return;
    }

    this.logger.log(
      `Dispatching ${eventType} event to ${configs.length} webhook(s) for merchant ${merchantId}`,
    );

    await Promise.allSettled(
      configs.map((config) => this.deliverWebhook(config, payload)),
    );
  }

  private async deliverWebhook(
    config: WebhookConfig,
    payload: WebhookEventPayload,
    attemptNumber = 1,
  ): Promise<void> {
    const attempt: WebhookDeliveryAttempt = {
      id: crypto.randomUUID(),
      webhook_id: config.id,
      event_type: payload.event,
      payload,
      url: config.url,
      status: 'pending',
      attempt_number: attemptNumber,
      created_at: new Date().toISOString(),
    };

    try {
      const signature = this.generateSignature(payload, config.secret);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'StellarPay-Webhooks/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      attempt.response_code = response.status;
      attempt.response_body = await response.text().catch(() => '');

      if (response.ok) {
        attempt.status = 'success';
        attempt.delivered_at = new Date().toISOString();
        this.logger.log(
          `Webhook delivered successfully to ${config.url} (attempt ${attemptNumber})`,
        );
      } else {
        attempt.status = 'failed';
        attempt.error_message = `HTTP ${response.status}: ${response.statusText}`;
        this.logger.warn(
          `Webhook delivery failed to ${config.url}: ${attempt.error_message} (attempt ${attemptNumber})`,
        );

        if (attemptNumber < this.MAX_RETRIES) {
          await this.scheduleRetry(config, payload, attemptNumber + 1);
        }
      }
    } catch (error) {
      attempt.status = 'failed';
      attempt.error_message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Webhook delivery error to ${config.url}: ${attempt.error_message} (attempt ${attemptNumber})`,
      );

      if (attemptNumber < this.MAX_RETRIES) {
        await this.scheduleRetry(config, payload, attemptNumber + 1);
      }
    } finally {
      this.webhookRepo.saveDeliveryAttempt(attempt);
    }
  }

  private async scheduleRetry(
    config: WebhookConfig,
    payload: WebhookEventPayload,
    attemptNumber: number,
  ): Promise<void> {
    // Exponential backoff: 2^(attempt-1) seconds
    const delayMs = Math.pow(2, attemptNumber - 1) * 1000;
    this.logger.log(
      `Scheduling retry ${attemptNumber} for ${config.url} in ${delayMs}ms`,
    );

    setTimeout(() => {
      void this.deliverWebhook(config, payload, attemptNumber);
    }, delayMs);
  }

  private generateSignature(payload: WebhookEventPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
    return signature === expectedSignature;
  }
}
