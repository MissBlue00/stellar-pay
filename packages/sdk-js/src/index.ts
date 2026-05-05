import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Injectable()
export class SdkService {
  private apiKey: string;
  private baseUrl: string;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('SDK_API_KEY');
    this.baseUrl = configService.get<string>('SDK_BASE_URL', 'https://api.example.com');
  }

  async makeRequest(endpoint: string): Promise<any> {
    // Implementation using apiKey and baseUrl
    return {};
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [SdkService],
  exports: [SdkService],
})
export class SdkModule {}
