import { Navigate, Outlet, useLocation, useNavigation } from 'react-router';
import { PageSkeleton } from '@/components/page-skeleton/page-skeleton';
import { ServerUnavailable } from '@/components/server-unavailable/server-unavailable';
import { useAuth } from '@/hooks/use-auth';

// Pathless layout route: everything below it needs an account.
export function RequireAuth() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const navigation = useNavigation();
  if (auth.state === 'loading') return <PageSkeleton />;
  if (auth.state === 'unavailable') return <ServerUnavailable onRetry={() => void auth.refresh()} />;
  // Signing out leaves for `/` first; while that lazy route still loads, wait instead of sending
  // the new guest to sign-in. A guest never sees the protected page either way.
  if (auth.state === 'guest') return navigation.state === 'idle'
    ? <Navigate to={`/auth?next=${encodeURIComponent(pathname)}`} replace />
    : <PageSkeleton />;
  return <Outlet />;
}
