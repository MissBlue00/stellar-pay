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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import { type MerchantUser } from '../auth/interfaces/merchant-user.interface';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookService } from './webhook.service';
import type { WebhookConfig } from './interfaces/webhook-config.interface';
import type { WebhookDeliveryAttempt } from './interfaces/webhook-event.interface';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a webhook configuration' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(
    @Body() dto: CreateWebhookDto,
    @CurrentMerchant() merchant: MerchantUser,
  ): WebhookConfig {
    return this.webhookService.createWebhook(merchant.merchant_id, dto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List webhook configurations' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  list(@CurrentMerchant() merchant: MerchantUser): WebhookConfig[] {
    return this.webhookService.listWebhooks(merchant.merchant_id);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a webhook configuration by ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a webhook configuration' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a webhook configuration' })
  @ApiResponse({ status: 204, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List webhook delivery attempts' })
  @ApiResponse({ status: 200, description: 'Delivery attempts retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
