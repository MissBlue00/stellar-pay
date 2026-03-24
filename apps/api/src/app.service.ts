import { Injectable } from '@nestjs/common';
import { apiLogger } from './observability';

const serviceLogger = apiLogger.child({
  serviceContext: 'AppService',
});

@Injectable()
export class AppService {
  getHello(): string {
    serviceLogger.debug('Returning hello payload', {
      event: 'hello_payload_returned',
    });

    return 'Hello World!';
  }
}
