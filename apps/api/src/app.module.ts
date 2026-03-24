import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { TreasuryModule } from './treasury/treasury.module';

@Module({
  imports: [HealthModule, TreasuryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
