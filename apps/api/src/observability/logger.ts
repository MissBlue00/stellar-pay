import { getCorrelationId, getRequestContext } from './request-context';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  environment: string;
  correlationId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
}

export type LogMetadata = Record<string, unknown>;

interface LoggerOptions {
  serviceName: string;
  defaults?: LogMetadata;
}

export class StructuredLogger {
  constructor(private readonly options: LoggerOptions) {}

  child(defaults: LogMetadata): StructuredLogger {
    return new StructuredLogger({
      ...this.options,
      defaults: {
        ...this.options.defaults,
        ...defaults,
      },
    });
  }

  debug(message: string, metadata: LogMetadata = {}): void {
    this.write('debug', message, metadata);
  }

  info(message: string, metadata: LogMetadata = {}): void {
    this.write('info', message, metadata);
  }

  warn(message: string, metadata: LogMetadata = {}): void {
    this.write('warn', message, metadata);
  }

  error(message: string, metadata: LogMetadata = {}): void {
    this.write('error', message, metadata);
  }

  private write(level: LogLevel, message: string, metadata: LogMetadata): void {
    if (!shouldLog(level)) {
      return;
    }

    const context = getRequestContext();
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.options.serviceName,
      message,
      environment: process.env.NODE_ENV ?? 'development',
      correlationId: getCorrelationId(),
      ...this.options.defaults,
      ...context,
      ...serializeMetadata(metadata),
    };

    Object.keys(entry).forEach((key) => {
      if (entry[key] === undefined) {
        delete entry[key];
      }
    });

    const payload = JSON.stringify(entry);

    if (level === 'error') {
      console.error(payload);
      return;
    }

    if (level === 'warn') {
      console.warn(payload);
      return;
    }

    console.log(payload);
  }
}

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = parseLogLevel(process.env.LOG_LEVEL);
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
    return value;
  }

  return 'info';
}

function serializeMetadata(metadata: LogMetadata): LogMetadata {
  return Object.entries(metadata).reduce<LogMetadata>((result, [key, value]) => {
    if (value === undefined) {
      return result;
    }

    if (key === 'error') {
      result.error = serializeError(value);
      return result;
    }

    if (value instanceof Error) {
      result[key] = serializeError(value);
      return result;
    }

    result[key] = value;
    return result;
  }, {});
}

function serializeError(error: unknown): StructuredLogEntry['error'] | unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

export const apiLogger = new StructuredLogger({
  serviceName: 'stellar-pay-api',
});
