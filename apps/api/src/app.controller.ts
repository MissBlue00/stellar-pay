import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import path from 'path';
import { AppService } from './app.service';
import { HelloRequestDto, HelloResponseDto } from './app.dto';
import { Public } from './auth/decorators/public.decorator';

interface HealthInfoResponse {
  status: 'ok';
  version: string;
  uptime: number;
  timestamp: string;
  environment: string;
}

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  getHello(): string {
    return this.appService.getHello();
  }

  @Get()
  @Public()
  getHealthInfo(): HealthInfoResponse {
    return this.buildHealthInfo();
  }

  @Get('health')
  @Public()
  getHealthInfoAlias(): HealthInfoResponse {
    return this.buildHealthInfo();
  }

  @Post('hello')
  @ApiOperation({ summary: 'Say hello to a specific user' })
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('ApiKey-auth')
  @ApiResponse({
    status: 201,
    description: 'The custom hello message.',
    type: HelloResponseDto,
  })
  sayHello(@Body() requestDto: HelloRequestDto): HelloResponseDto {
    const name = requestDto.name ?? 'World';
    return { message: `Hello ${name}!` };
  }

  private buildHealthInfo(): HealthInfoResponse {
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
