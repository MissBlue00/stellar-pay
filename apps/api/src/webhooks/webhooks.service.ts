import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { randomUUID, createHmac } from 'crypto';
import type {
  WebhookEvent,
  WebhookDelivery,
  WebhookJobData,
  WebhookEndpointRecord,
} from './interfaces/webhook-event.interface';
import { PrismaService } from '../prisma/prisma.service';

const RETRY_DELAYS = [10_000, 60_000, 300_000, 1_800_000]; // 10s, 1m, 5m, 30m

@Injectable()
export class WebhooksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly failedDeliveries = new Map<string, WebhookDelivery[]>();
  private readonly queue: Queue;
  private readonly worker: Worker;

  constructor(private readonly prisma: PrismaService) {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    };

    this.queue = new Queue('webhook-delivery', { connection });
    this.worker = new Worker('webhook-delivery', async (job) => this.processJob(job), {
      connection,
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Webhook worker started');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }

  private formatEndpoint(record: {
    id: string;
    merchantId: string;
    url: string;
    secret: string;
    createdAt: Date;
    updatedAt: Date;
  }): WebhookEndpointRecord {
    return {
      id: record.id,
      merchantId: record.merchantId,
      url: record.url,
      secret: record.secret,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async createEndpoint(
    merchantId: string,
    url: string,
    secret: string,
  ): Promise<WebhookEndpointRecord> {
    const record = await this.prisma.webhookEndpoint.create({
      data: {
        merchantId,
        url,
        secret,
      },
    });

    return this.formatEndpoint(record);
  }

  async getEndpoints(merchantId?: string): Promise<WebhookEndpointRecord[]> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: merchantId ? { merchantId } : undefined,
    });

    return endpoints.map((endpoint) => this.formatEndpoint(endpoint));
  }

  async getEndpoint(id: string): Promise<WebhookEndpointRecord | undefined> {
    const endpoint = await this.prisma.webhookEndpoint.findUnique({ where: { id } });
    return endpoint ? this.formatEndpoint(endpoint) : undefined;
  }

  async deleteEndpoint(id: string): Promise<boolean> {
    const endpoint = await this.prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!endpoint) {
      return false;
    }

    await this.prisma.webhookEndpoint.delete({ where: { id } });
    return true;
  }

  async dispatchEvent(type: string, payload: Record<string, unknown>): Promise<void> {
    const activeEndpoints = await this.prisma.webhookEndpoint.findMany();

    for (const endpoint of activeEndpoints) {
      const event: WebhookEvent = {
        webhookId: endpoint.id,
        merchantId: endpoint.merchantId,
        url: endpoint.url,
        secret: endpoint.secret,
        type,
        payload,
        createdAt: new Date().toISOString(),
      };

      await this.queue.add(
        'deliver',
        {
          webhookId: event.webhookId,
          eventId: randomUUID(),
          merchantId: event.merchantId,
          url: event.url,
          secret: event.secret,
          type: event.type,
          payload: event.payload,
          attempt: 0,
          maxAttempts: RETRY_DELAYS.length,
        } satisfies WebhookJobData,
        {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );

      this.logger.log(`Queued webhook delivery: ${event.type} → ${event.url}`);
    }
  }

  getFailedDeliveries(webhookId: string): WebhookDelivery[] {
    return this.failedDeliveries.get(webhookId) ?? [];
  }

  private async processJob(job: { data: WebhookJobData }): Promise<void> {
    const data = job.data;

    try {
      const signature = this.computeSignature(data.payload, data.secret);
      const response = await fetch(data.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': data.type,
          'X-Webhook-Attempt': String(data.attempt + 1),
          'X-Webhook-Event-Id': data.eventId,
        },
        body: JSON.stringify({
          event: data.type,
          eventId: data.eventId,
          createdAt: new Date().toISOString(),
          data: data.payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`Webhook delivered successfully: ${data.eventId} → ${data.url}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const nextAttempt = data.attempt + 1;

      if (nextAttempt < data.maxAttempts) {
        const delay = RETRY_DELAYS[data.attempt];
        this.logger.warn(
          `Webhook delivery failed (attempt ${nextAttempt}/${data.maxAttempts}): ${data.eventId} → ${data.url} - ${errorMessage}. Retrying in ${delay / 1000}s`,
        );

        await this.queue.add('deliver', { ...data, attempt: nextAttempt }, { delay, attempts: 1 });
      } else {
        this.logger.error(
          `Webhook delivery failed permanently: ${data.eventId} → ${data.url} - ${errorMessage}`,
        );

        const delivery: WebhookDelivery = {
          webhookId: data.webhookId,
          eventId: data.eventId,
          merchantId: data.merchantId,
          url: data.url,
          type: data.type,
          attempt: nextAttempt,
          status: 'failed',
          error: errorMessage,
          deliveredAt: new Date().toISOString(),
        };

        const existing = this.failedDeliveries.get(data.webhookId) ?? [];
        existing.push(delivery);
        this.failedDeliveries.set(data.webhookId, existing);
      }
    }
  }

  private computeSignature(payload: Record<string, unknown>, secret: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}
