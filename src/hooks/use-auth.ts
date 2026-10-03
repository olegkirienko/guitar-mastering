import { useContext } from 'react';
import { AuthContext } from '@/auth/auth-provider/constants';
import type { AuthContextValue } from '@/auth/auth-provider/types';

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
