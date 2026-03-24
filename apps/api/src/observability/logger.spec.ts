import { StructuredLogger } from './logger';
import { runWithRequestContext } from './request-context';

describe('StructuredLogger', () => {
  const originalLogLevel = process.env.LOG_LEVEL;

  afterEach(() => {
    process.env.LOG_LEVEL = originalLogLevel;
    jest.restoreAllMocks();
  });

  it('emits structured JSON with the active correlation id', () => {
    process.env.LOG_LEVEL = 'debug';

    const writeSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = new StructuredLogger({
      serviceName: 'test-service',
    });

    runWithRequestContext({ correlationId: 'corr-123' }, () => {
      logger.info('test message', {
        event: 'test_event',
        route: '/health',
      });
    });

    expect(writeSpy).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({
      service: 'test-service',
      message: 'test message',
      event: 'test_event',
      route: '/health',
      correlationId: 'corr-123',
      level: 'info',
    });
  });

  it('respects the configured log level', () => {
    process.env.LOG_LEVEL = 'error';

    const writeSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = new StructuredLogger({
      serviceName: 'test-service',
    });

    logger.info('should not be written');

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
