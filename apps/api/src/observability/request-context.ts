import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface ApiRequestContext {
  correlationId: string;
  requestId?: string;
  userId?: string;
  route?: string;
  method?: string;
  [key: string]: unknown;
}

const storage = new AsyncLocalStorage<ApiRequestContext>();

export function createCorrelationId(seed?: string): string {
  const value = seed?.trim();
  return value && value.length > 0 ? value : randomUUID();
}

export function runWithRequestContext<T>(
  context: Partial<ApiRequestContext>,
  callback: () => T,
): T {
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

export function getRequestContext(): ApiRequestContext | undefined {
  return storage.getStore();
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
