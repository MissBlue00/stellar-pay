import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import { type MerchantUser } from '../auth/interfaces/merchant-user.interface';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookService } from './webhook.service';
import type { WebhookConfig } from './interfaces/webhook-config.interface';
import type { WebhookDeliveryAttempt } from './interfaces/webhook-event.interface';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateWebhookDto,
    @CurrentMerchant() merchant: MerchantUser,
  ): WebhookConfig {
    return this.webhookService.createWebhook(merchant.merchant_id, dto);
  }

  @Get()
  list(@CurrentMerchant() merchant: MerchantUser): WebhookConfig[] {
    return this.webhookService.listWebhooks(merchant.merchant_id);
  }

  @Get(':id')
  get(
    @Param('id') id: string,
    @CurrentMerchant() merchant: MerchantUser,
  ): WebhookConfig {
    const webhook = this.webhookService.getWebhook(id);
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    if (webhook.merchant_id !== merchant.merchant_id) {
      throw new ForbiddenException('Access denied');
    }
    return webhook;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
    @CurrentMerchant() merchant: MerchantUser,
  ): WebhookConfig {
    const webhook = this.webhookService.getWebhook(id);
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    if (webhook.merchant_id !== merchant.merchant_id) {
      throw new ForbiddenException('Access denied');
    }

    const updated = this.webhookService.updateWebhook(id, dto);
    if (!updated) {
      throw new NotFoundException('Webhook not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id') id: string,
    @CurrentMerchant() merchant: MerchantUser,
  ): void {
    const webhook = this.webhookService.getWebhook(id);
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    if (webhook.merchant_id !== merchant.merchant_id) {
      throw new ForbiddenException('Access denied');
    }

    const deleted = this.webhookService.deleteWebhook(id);
    if (!deleted) {
      throw new NotFoundException('Webhook not found');
    }
  }

  @Get(':id/deliveries')
  getDeliveries(
    @Param('id') id: string,
    @CurrentMerchant() merchant: MerchantUser,
  ): WebhookDeliveryAttempt[] {
    const webhook = this.webhookService.getWebhook(id);
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    if (webhook.merchant_id !== merchant.merchant_id) {
      throw new ForbiddenException('Access denied');
    }

    return this.webhookService.getDeliveryAttempts(id);
  }
}
