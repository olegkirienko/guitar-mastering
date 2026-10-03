import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from '@/auth/auth-provider/constants';
import type { AccountUser, AuthContextValue, AuthState, Credentials, Profile } from '@/auth/auth-provider/types';
import { api } from '@/auth/auth-provider/utils/api';

export function AuthProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [state, setState] = useState<AuthState>(enabled ? 'loading' : 'guest');
  const [user, setUser] = useState<AccountUser | null>(null);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const result = await api<{ user: AccountUser | null }>('/session');
      setUser(result.user);
      setState(result.user ? 'authenticated' : 'guest');
    } catch {
      setState('unavailable');
    }
  }, [enabled]);
  useEffect(() => { void refresh(); }, [refresh]);

  const authenticate = useCallback(async (kind: 'register' | 'login', credentials: Credentials) => {
    const result = await api<{ user: AccountUser }>(`/auth/${kind}`, { method: 'POST', body: JSON.stringify(credentials) });
    setUser(result.user);
    setState('authenticated');
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    state,
    user,
    refresh,
    register: (credentials) => authenticate('register', credentials),
    login: (credentials) => authenticate('login', credentials),
    logout: async () => { await api('/auth/logout', { method: 'POST', body: '{}' }); setUser(null); setState('guest'); },
    updateProfile: async (profile) => {
      const result = await api<{ profile: Profile }>('/profile', { method: 'PATCH', body: JSON.stringify(profile) });
      setUser((current) => current ? { ...current, profile: result.profile } : current);
    },
    deleteAccount: async (password) => { await api('/account', { method: 'DELETE', body: JSON.stringify({ password }) }); setUser(null); setState('guest'); },
  }), [authenticate, refresh, state, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
