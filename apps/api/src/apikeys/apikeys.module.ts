import { Module } from '@nestjs/common';
import { ApikeysService } from './apikeys.service';
import { ApikeysController } from './apikeys.controller';

@Module({
  controllers: [ApikeysController],
  providers: [ApikeysService],
  exports: [ApikeysService],
})
export class ApikeysModule {}
