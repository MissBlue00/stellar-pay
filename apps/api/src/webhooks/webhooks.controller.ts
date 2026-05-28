import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  createEndpoint(@Body() dto: CreateWebhookEndpointDto) {
    return this.webhooksService.createEndpoint(dto.merchantId, dto.url, dto.secret);
  }

  @Get()
  listEndpoints(@Query('merchantId') merchantId?: string) {
    return this.webhooksService.getEndpoints(merchantId);
  }

  @Get(':id')
  getEndpoint(@Param('id') id: string) {
    const endpoint = this.webhooksService.getEndpoint(id);
    if (!endpoint) {
      throw new NotFoundException(`Webhook endpoint ${id} not found`);
    }
    return endpoint;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteEndpoint(@Param('id') id: string) {
    const deleted = this.webhooksService.deleteEndpoint(id);
    if (!deleted) {
      throw new NotFoundException(`Webhook endpoint ${id} not found`);
    }
  }

  @Get(':id/failures')
  getFailures(@Param('id') id: string) {
    return this.webhooksService.getFailedDeliveries(id);
  }
}
