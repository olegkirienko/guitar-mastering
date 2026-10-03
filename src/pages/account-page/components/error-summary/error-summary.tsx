import { ApiError } from '@/utils/api-error';

export function ErrorSummary({ error }: { error: ApiError | null }) {
  if (!error) return null;
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error.message}</div>;
}
