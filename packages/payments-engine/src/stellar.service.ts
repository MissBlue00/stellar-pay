import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StellarService {
  constructor(private configService: ConfigService) {
    // validation at startup ensures all required env vars are present
  }

  private getStellarRpcUrl(): string {
    return this.configService.get<string>('STELLAR_RPC_URL');
  }

  private getTreasuryPrivateKey(): string {
    return this.configService.get<string>('TREASURY_PRIVATE_KEY');
  }

  // Additional methods using ConfigService
}
