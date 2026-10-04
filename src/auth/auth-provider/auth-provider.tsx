import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AuthContext, defaultPreferences } from '@/auth/auth-provider/constants';
import type { AccountUser, AuthContextValue, AuthState, Credentials, Preferences, Profile } from '@/auth/auth-provider/types';
import { api } from '@/auth/auth-provider/utils/api';

export function AuthProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [state, setState] = useState<AuthState>(enabled ? 'loading' : 'guest');
  const [user, setUser] = useState<AccountUser | null>(null);
  const [preferencesSaveFailed, setPreferencesSaveFailed] = useState(false);
  // The latest requested preferences, so quick toggles build on each other before React re-renders.
  const preferencesRef = useRef<Preferences>(defaultPreferences);
  const applyUser = useCallback((next: AccountUser | null) => {
    preferencesRef.current = next?.preferences ?? defaultPreferences;
    setUser(next);
  }, []);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const result = await api<{ user: AccountUser | null }>('/session');
      applyUser(result.user);
      setState(result.user ? 'authenticated' : 'guest');
    } catch {
      setState('unavailable');
    }
  }, [applyUser, enabled]);
  useEffect(() => { void refresh(); }, [refresh]);

  const authenticate = useCallback(async (kind: 'register' | 'login', credentials: Credentials) => {
    const result = await api<{ user: AccountUser }>(`/auth/${kind}`, { method: 'POST', body: JSON.stringify(credentials) });
    applyUser(result.user);
    setState('authenticated');
  }, [applyUser]);
  const updatePreferences = useCallback(async (patch: Partial<Preferences>) => {
    const previous = preferencesRef.current;
    const next = { ...previous, ...patch };
    preferencesRef.current = next;
    setPreferencesSaveFailed(false);
    setUser((current) => current ? { ...current, preferences: next } : current);
    try {
      await api<{ preferences: Preferences }>('/preferences', { method: 'PUT', body: JSON.stringify(next) });
    } catch {
      if (preferencesRef.current !== next) return;
      preferencesRef.current = previous;
      setPreferencesSaveFailed(true);
      setUser((current) => current ? { ...current, preferences: previous } : current);
    }
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    state,
    user,
    preferences: user?.preferences ?? defaultPreferences,
    preferencesSaveFailed,
    refresh,
    register: (credentials) => authenticate('register', credentials),
    login: (credentials) => authenticate('login', credentials),
    logout: async () => { await api('/auth/logout', { method: 'POST', body: '{}' }); applyUser(null); setState('guest'); },
    updateProfile: async (profile) => {
      const result = await api<{ profile: Profile }>('/profile', { method: 'PATCH', body: JSON.stringify(profile) });
      setUser((current) => current ? { ...current, profile: result.profile } : current);
    },
    updatePreferences,
    deleteAccount: async (password) => { await api('/account', { method: 'DELETE', body: JSON.stringify({ password }) }); applyUser(null); setState('guest'); },
  }), [applyUser, authenticate, preferencesSaveFailed, refresh, state, updatePreferences, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
