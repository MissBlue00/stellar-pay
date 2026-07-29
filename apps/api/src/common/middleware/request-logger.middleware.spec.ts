import type { Request, Response } from 'express';
import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware();
    jest.restoreAllMocks();
  });

  function createMockResponse(statusCode = 200) {
    const listeners: Record<string, Array<() => void>> = {};
    const res = {
      statusCode,
      on: jest.fn((event: string, listener: () => void) => {
        listeners[event] = [...(listeners[event] || []), listener];
        return res;
      }),
      once: jest.fn((event: string, listener: () => void) => {
        listeners[event] = [...(listeners[event] || []), listener];
        return res;
      }),
      emit: (event: string) => {
        (listeners[event] || []).forEach((listener) => listener());
      },
    } as unknown as Response;

    return {
      res,
      emitFinish: () => {
        (res as unknown as { emit: (event: string) => void }).emit('finish');
      },
    };
  }

  it('logs successful requests as info with structured JSON payload', () => {
    const loggerSpy = jest.spyOn(middleware['logger'], 'log').mockImplementation(() => undefined);
    const req = {
      method: 'GET',
      originalUrl: '/health',
      headers: { 'x-request-id': 'req-123' },
      get: (name: string) => req.headers[name],
    } as unknown as Request;
    const { res, emitFinish } = createMockResponse(200);
    const next = jest.fn();

    middleware.use(req, res, next);
    emitFinish();

    expect(next).toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('"statusCode":200'));
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('"requestId":"req-123"'));
  });

  it('logs 4xx responses as warnings', () => {
    const loggerSpy = jest.spyOn(middleware['logger'], 'warn').mockImplementation(() => undefined);
    const req = {
      method: 'GET',
      originalUrl: '/missing',
      headers: {},
      get: () => undefined,
    } as unknown as Request;
    const { res, emitFinish } = createMockResponse(404);
    const next = jest.fn();

    middleware.use(req, res, next);
    emitFinish();

    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('"statusCode":404'));
  });

  it('logs 5xx responses as errors', () => {
    const loggerSpy = jest.spyOn(middleware['logger'], 'error').mockImplementation(() => undefined);
    const req = {
      method: 'POST',
      originalUrl: '/payments',
      headers: {},
      get: () => undefined,
    } as unknown as Request;
    const { res, emitFinish } = createMockResponse(500);
    const next = jest.fn();

    middleware.use(req, res, next);
    emitFinish();

    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('"statusCode":500'));
  });
});
