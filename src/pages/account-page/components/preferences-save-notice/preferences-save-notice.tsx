import { preferencesSaveFailedMessage } from '@/constants/preferences';
import { useAuth } from '@/hooks/use-auth';

// One notice for the whole page: a rejected save is reverted, and the flag covers every preference.
export function PreferencesSaveNotice() {
  const { preferencesSaveFailed } = useAuth();
  return <p className="text-sm text-error-primary" aria-live="polite">{preferencesSaveFailed && preferencesSaveFailedMessage}</p>;
}
