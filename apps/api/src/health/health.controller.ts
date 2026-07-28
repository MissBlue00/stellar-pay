import { Controller, Get } from '@nestjs/common';
import { readFileSync } from 'fs';
import path from 'path';
import { Public } from '../auth/decorators/public.decorator';

interface HealthInfoResponse {
  status: 'ok';
  version: string;
  uptime: number;
  timestamp: string;
  environment: string;
}

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check(): HealthInfoResponse {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string };

    return {
      status: 'ok',
      version: packageJson.version ?? '0.0.0',
      uptime: Number(process.uptime().toFixed(3)),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
