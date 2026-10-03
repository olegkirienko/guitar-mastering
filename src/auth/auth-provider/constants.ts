import { createContext } from 'react';
import type { AuthContextValue } from '@/auth/auth-provider/types';

export const AuthContext = createContext<AuthContextValue | null>(null);
