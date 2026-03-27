import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { TreasuryModule } from './treasury/treasury.module';
import { AuthModule } from './auth/auth.module';
import { CheckoutSessionModule } from './checkout/checkout-session.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ThrottlerRedisGuard } from './rate-limiter/guards/throttler-redis.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'stellar_pay',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.DB_LOGGING === 'true',
    }),
    HealthModule,
    TreasuryModule,
    AuthModule,
    CheckoutSessionModule,
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
