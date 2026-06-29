import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator.js';
import { type MerchantUser } from '../auth/interfaces/merchant-user.interface.js';
import { ApiKeysService, type CreateApiKeyResponse } from './api-keys.service.js';

@ApiTags('api-keys')
@Controller('apikeys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate a new API key for server-to-server integrations' })
  @ApiResponse({
    status: 201,
    description: 'API key generated successfully. The plaintext key is returned only once.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        api_key: { type: 'string' },
        prefix: { type: 'string' },
        created_at: { type: 'string' },
      },
    },
  })
  async createApiKey(@CurrentMerchant() merchant: MerchantUser): Promise<CreateApiKeyResponse> {
    return this.apiKeysService.generateKey(merchant.merchant_id);
  }
}
