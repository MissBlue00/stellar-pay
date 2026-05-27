import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator.js';
import { type MerchantUser } from '../auth/interfaces/merchant-user.interface.js';
import { ApiKeysService, type CreateApiKeyResult } from './api-keys.service.js';

@Controller('apikeys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createApiKey(@CurrentMerchant() merchant: MerchantUser): Promise<CreateApiKeyResult> {
    return this.apiKeysService.createApiKey(merchant.merchant_id);
  }
}
