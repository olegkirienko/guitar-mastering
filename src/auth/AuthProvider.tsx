import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Profile = { firstName: string | null; lastName: string | null; avatarId: string | null };
export type AccountUser = { id: string; username: string; profile: Profile };
type Credentials = { username: string; password: string };

export class ApiError extends Error {
  readonly code: string;
  readonly fields: Record<string, string>;
  constructor(code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
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

type AuthState = 'loading' | 'guest' | 'authenticated' | 'unavailable';
type AuthContextValue = {
  state: AuthState;
  user: AccountUser | null;
  refresh(): Promise<void>;
  register(credentials: Credentials): Promise<void>;
  login(credentials: Credentials): Promise<void>;
  logout(): Promise<void>;
  updateProfile(profile: Partial<Profile>): Promise<void>;
  deleteAccount(password: string): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
