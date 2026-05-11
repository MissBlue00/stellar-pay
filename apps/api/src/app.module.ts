import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { TreasuryModule } from './treasury/treasury.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ThrottlerRedisGuard } from './rate-limiter/guards/throttler-redis.guard';
import { WorkerModule } from './modules/worker/worker.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    HealthModule,
    TreasuryModule,
    AuthModule,
    WorkerModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 60000, limit: 100 },
        { name: 'long', ttl: 60000, limit: 1000 },
      ],
      // TODO: Implement Redis storage when Redis service is available
      // storage: new ThrottlerStorageRedisService(),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerRedisGuard,
    },
  ],
})
export class AppModule {}
