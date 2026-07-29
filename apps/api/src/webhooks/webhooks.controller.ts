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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';

@ApiTags('webhook-endpoints')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Webhook endpoint created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  createEndpoint(@Body() dto: CreateWebhookEndpointDto) {
    return this.webhooksService.createEndpoint(dto.merchantId, dto.url, dto.secret);
  }

  @Get()
  @ApiOperation({ summary: 'List webhook endpoints' })
  @ApiResponse({ status: 200, description: 'Webhook endpoints retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  listEndpoints(@Query('merchantId') merchantId?: string) {
    return this.webhooksService.getEndpoints(merchantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook endpoint by ID' })
  @ApiResponse({ status: 200, description: 'Webhook endpoint retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getEndpoint(@Param('id') id: string) {
    const endpoint = await this.webhooksService.getEndpoint(id);
    if (!endpoint) {
      throw new NotFoundException(`Webhook endpoint ${id} not found`);
    }
    return endpoint;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  @ApiResponse({ status: 204, description: 'Webhook endpoint deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteEndpoint(@Param('id') id: string) {
    const deleted = await this.webhooksService.deleteEndpoint(id);
    if (!deleted) {
      throw new NotFoundException(`Webhook endpoint ${id} not found`);
    }
  }

  @Get(':id/failures')
  @ApiOperation({ summary: 'List failed deliveries for a webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Failed deliveries retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getFailures(@Param('id') id: string) {
    return this.webhooksService.getFailedDeliveries(id);
  }
}
