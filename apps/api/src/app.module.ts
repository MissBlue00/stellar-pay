import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { TreasuryModule } from './treasury/treasury.module';
import { AuthModule } from './auth/auth.module';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { AuditLogModule } from './audit-log/audit-log.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ThrottlerRedisGuard } from './rate-limiter/guards/throttler-redis.guard';
import { ThrottlerStorageRedisService } from './rate-limiter/throttler-storage-redis.service';
import { TransactionsModule } from './transactions/transactions.module';
import { WorkerModule } from './modules/worker/worker.module';
import { WebhookModule } from './webhooks/webhook.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-exception.filter';

@Module({
  imports: [
    ApiKeysModule,
    AuditLogModule,
    HealthModule,
    TreasuryModule,
    AuthModule,
    TransactionsModule,
    WorkerModule,
    WebhookModule,
    PaymentsModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 60000, limit: 100 },
        { name: 'long', ttl: 60000, limit: 1000 },
      ],
      storage: new ThrottlerStorageRedisService(),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ThrottlerStorageRedisService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerRedisGuard,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
  ],
})
export class AppModule {}
