import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface RequestContext {
  correlationId: string;
  requestId?: string;
  traceId?: string;
  userId?: string;
  [key: string]: unknown;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function createCorrelationId(seed?: string): string {
  const value = seed?.trim();
  return value && value.length > 0 ? value : randomUUID();
}

export function runWithRequestContext<T>(context: Partial<RequestContext>, callback: () => T): T {
  const current = storage.getStore();

  return storage.run(
    {
      ...current,
      ...context,
      correlationId: createCorrelationId(context.correlationId ?? current?.correlationId),
    },
    callback,
  );
}

export function runWithCorrelationId<T>(correlationId: string, callback: () => T): T {
  return runWithRequestContext({ correlationId }, callback);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
