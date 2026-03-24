import { Module } from '@nestjs/common';
import { WatcherService } from './watcher.service';

/**
 * The WatcherModule encapsulates all the logic for blockchain network monitoring.
 */
@Module({
  providers: [WatcherService],
  exports: [WatcherService],
})
export class WatcherModule {}
