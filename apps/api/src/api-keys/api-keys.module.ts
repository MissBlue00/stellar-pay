import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller.js';
import { ApiKeysService } from './api-keys.service.js';
import { PrismaService } from './prisma.service.js';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, PrismaService],
})
export class ApiKeysModule {}
