import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { StellarService } from './stellar.service';
// ... other imports

@Module({
  imports: [
    AppConfigModule,
    // ... other modules
  ],
  providers: [StellarService],
  // ...
})
export class PaymentsEngineModule {}
