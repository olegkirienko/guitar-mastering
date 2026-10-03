import { ApiError } from '@/utils/api-error';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers,
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Не вдалося зв’язатися із сервером. Спробуй ще раз.');
  }
  if (response.status === 204) return undefined as T;
  const value = await response.json().catch(() => null) as { error?: { code?: string; message?: string; fields?: Record<string, string> } } | null;
  if (!response.ok) throw new ApiError(value?.error?.code ?? 'REQUEST_FAILED', value?.error?.message ?? 'Запит не виконано.', value?.error?.fields);
  return value as T;
}
