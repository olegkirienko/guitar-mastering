import { createContext } from 'react';
import type { AuthContextValue, Preferences } from '@/auth/auth-provider/types';

export const AuthContext = createContext<AuthContextValue | null>(null);

// The server's defaults when the account has no saved preferences.
export const defaultPreferences: Preferences = { audioEnabled: false, prefersStatic: false };
