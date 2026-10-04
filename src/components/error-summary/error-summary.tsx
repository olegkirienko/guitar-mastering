import { ApiError } from '@/utils/api-error';

export function ErrorSummary({ error }: { error: ApiError | null }) {
  if (!error) return null;
  return <div role="alert" className="rounded-lg border border-error_subtle bg-error-primary p-3 text-sm text-error-primary">{error.message}</div>;
}
