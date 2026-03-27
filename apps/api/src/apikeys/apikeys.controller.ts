import { Controller, Post, Request } from '@nestjs/common';
import { ApikeysService } from './apikeys.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@Controller('apikeys')
export class ApikeysController {
  constructor(private readonly apikeysService: ApikeysService) {}

  @Post()
  async createApiKey(@Request() req: AuthenticatedRequest) {
    // Assuming merchant ID is available from auth context, e.g., req.user?.id
    const merchantId = req.user?.id || 'merchant-123';
    return this.apikeysService.generateApiKey(merchantId);
  }
}
