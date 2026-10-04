import { Navigate, Outlet, useLocation } from 'react-router';
import { PageSkeleton } from '@/components/page-skeleton/page-skeleton';
import { ServerUnavailable } from '@/components/server-unavailable/server-unavailable';
import { useAuth } from '@/hooks/use-auth';

// Pathless layout route: everything below it needs an account.
export function RequireAuth() {
  const auth = useAuth();
  const { pathname } = useLocation();
  if (auth.state === 'loading') return <PageSkeleton />;
  if (auth.state === 'unavailable') return <ServerUnavailable onRetry={() => void auth.refresh()} />;
  if (auth.state === 'guest') return <Navigate to={`/auth?next=${encodeURIComponent(pathname)}`} replace />;
  return <Outlet />;
}
