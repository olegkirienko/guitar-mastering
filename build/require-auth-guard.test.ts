import { describe, expect, it } from 'vitest';
import { guardOutcome } from '../src/components/require-auth/utils/guard-outcome.ts';

describe('account guard outcome', () => {
  it.each([
    ['loading', 'idle', 'skeleton'],
    ['unavailable', 'idle', 'unavailable'],
    ['authenticated', 'idle', 'content'],
    ['authenticated', 'loading', 'content'],
    // A direct guest visit is sent to sign-in.
    ['guest', 'idle', 'sign-in'],
    // Signing out: the guest renders while the navigation to `/` is still pending, so wait.
    ['guest', 'loading', 'skeleton'],
    ['guest', 'submitting', 'skeleton'],
  ] as const)('auth %s with navigation %s renders %s', (auth, navigation, outcome) => {
    expect(guardOutcome(auth, navigation)).toBe(outcome);
  });

  it('never gives a guest the protected content', () => {
    for (const navigation of ['idle', 'loading', 'submitting'] as const) {
      expect(guardOutcome('guest', navigation)).not.toBe('content');
    }
  });
});
