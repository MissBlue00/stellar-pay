import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StellarService {
  private horizonUrl: string;

  constructor(private configService: ConfigService) {
    this.horizonUrl = this.configService.get<string>('STELLAR_HORIZON_URL', 'https://horizon.stellar.org');
  }

  getHorizonUrl(): string {
    return this.horizonUrl;
  }

  // Additional methods using ConfigService if needed
}