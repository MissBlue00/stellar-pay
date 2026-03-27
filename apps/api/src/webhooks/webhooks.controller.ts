import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import type {
  DispatchWebhookRequest,
  DispatchWebhookResponse,
} from './interfaces/dispatch-webhook.interface';
import { WebhooksService } from './webhooks.service';

@Public()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('dispatch')
  async dispatch<TData>(
    @Body() body: DispatchWebhookRequest<TData>,
  ): Promise<DispatchWebhookResponse<TData>> {
    return this.webhooksService.dispatchToEndpoints(body.endpoints, body.event, body.data);
  }
}
