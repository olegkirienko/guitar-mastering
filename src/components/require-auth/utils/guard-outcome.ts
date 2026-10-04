import type { AuthState } from '@/auth/auth-provider/types';

export type GuardOutcome = 'skeleton' | 'unavailable' | 'sign-in' | 'content';

// What the account guard renders. A guest is sent to sign-in only when no navigation is pending:
// signing out navigates to `/` first, and the guest state can render against the old protected
// route before React commits that navigation; redirecting then would override `/`.
// A guest never gets the content either way.
export function guardOutcome(auth: AuthState, navigation: 'idle' | 'loading' | 'submitting'): GuardOutcome {
  if (auth === 'loading') return 'skeleton';
  if (auth === 'unavailable') return 'unavailable';
  if (auth === 'guest') return navigation === 'idle' ? 'sign-in' : 'skeleton';
  return 'content';
}
