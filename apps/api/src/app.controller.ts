import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { apiLogger } from './observability';

const controllerLogger = apiLogger.child({
  controller: 'AppController',
});

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    controllerLogger.info('Processing hello endpoint', {
      event: 'hello_endpoint_requested',
    });

    return this.appService.getHello();
  }
}
