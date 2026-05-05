import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { TreasuryModule } from './treasury/treasury.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ThrottlerRedisGuard } from './rate-limiter/guards/throttler-redis.guard';
import { WorkerModule } from './modules/worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        STELLAR_NETWORK: Joi.string().valid('TESTNET', 'PUBLIC').required(),
        STELLAR_HORIZON_URL: Joi.string().uri().required(),
        TREASURY_WALLET_ADDRESS: Joi.string().required(),
        SUPPORTED_ASSETS: Joi.string().required(),
        DATABASE_URL: Joi.string().uri(),
        REDIS_URL: Joi.string().uri(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
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
