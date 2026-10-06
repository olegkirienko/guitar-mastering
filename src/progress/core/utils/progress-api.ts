import type { ApiErrorBody, ProgressItem, ProgressValue, SaveProgress } from '@/progress/core/types';

export class ProgressApiError<Value extends ProgressValue = ProgressValue> extends Error {
  constructor(readonly code: string, message: string, readonly current?: ProgressItem<Value>) {
    super(message);
  }
}

async function responseValue<Value extends ProgressValue, Result>(response: Response): Promise<Result> {
  const body = await response.json().catch(() => null) as (ApiErrorBody<Value> & Result) | null;
  if (!response.ok) {
    throw new ProgressApiError(
      body?.error?.code ?? 'REQUEST_FAILED',
      body?.error?.message ?? 'Не вдалося синхронізувати прогрес.',
      body?.error?.current,
    );
  }
  return body as Result;
}

export function createProgressApi<Value extends ProgressValue = ProgressValue>() {
  return {
    async list(): Promise<ProgressItem<Value>[]> {
      const response = await fetch('/api/v1/progress');
      return (await responseValue<Value, { items: ProgressItem<Value>[] }>(response)).items;
    },
    async get(lessonId: string): Promise<ProgressItem<Value>> {
      const response = await fetch(`/api/v1/progress/${encodeURIComponent(lessonId)}`);
      return (await responseValue<Value, { item: ProgressItem<Value> }>(response)).item;
    },
    // Clears the lesson and every lesson after it, and answers with what is left.
    async reset(lessonId: string): Promise<ProgressItem<Value>[]> {
      let response: Response;
      try {
        response = await fetch(`/api/v1/progress/${encodeURIComponent(lessonId)}/reset`, {
          method: 'POST',
          // The server rejects a mutating request without the JSON media type.
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
      } catch {
        throw new ProgressApiError('NETWORK_ERROR', 'Не вдалося зв’язатися із сервером.');
      }
      return (await responseValue<Value, { items: ProgressItem<Value>[] }>(response)).items;
    },
    async save(lessonId: string, value: SaveProgress<Value>): Promise<ProgressItem<Value>> {
      let response: Response;
      try {
        response = await fetch(`/api/v1/progress/${encodeURIComponent(lessonId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });
      } catch {
        throw new ProgressApiError('NETWORK_ERROR', 'Не вдалося зв’язатися із сервером.');
      }
      return (await responseValue<Value, { item: ProgressItem<Value> }>(response)).item;
    },
  };
}
