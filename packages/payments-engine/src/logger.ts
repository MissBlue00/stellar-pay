import { getCorrelationId, getRequestContext } from './request-context';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogTransport {
  write(entry: StructuredLogEntry): void;
}

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
  transport?: LogTransport;
  defaults?: LogMetadata;
}

class ConsoleJsonTransport implements LogTransport {
  write(entry: StructuredLogEntry): void {
    const serialized = JSON.stringify(entry);

    if (entry.level === 'error') {
      console.error(serialized);
      return;
    }

    if (entry.level === 'warn') {
      console.warn(serialized);
      return;
    }

    console.log(serialized);
  }
}

export class StructuredLogger {
  private readonly transport: LogTransport;

  constructor(private readonly options: LoggerOptions) {
    this.transport = options.transport ?? new ConsoleJsonTransport();
  }

  child(defaults: LogMetadata): StructuredLogger {
    return new StructuredLogger({
      ...this.options,
      defaults: {
        ...this.options.defaults,
        ...defaults,
      },
      transport: this.transport,
    });
  }

  debug(message: string, metadata: LogMetadata = {}): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata: LogMetadata = {}): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata: LogMetadata = {}): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata: LogMetadata = {}): void {
    this.log('error', message, metadata);
  }

  private log(level: LogLevel, message: string, metadata: LogMetadata): void {
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

    this.transport.write(entry);
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

export function createLogger(options: Partial<LoggerOptions> = {}): StructuredLogger {
  return new StructuredLogger({
    serviceName: options.serviceName ?? '@stellar-pay/payments-engine',
    transport: options.transport,
    defaults: options.defaults,
  });
}

export const logger = createLogger({ serviceName: '@stellar-pay/payments-engine' });
