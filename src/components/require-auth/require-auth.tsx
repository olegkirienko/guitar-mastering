import { Navigate, Outlet, useLocation, useNavigation } from 'react-router';
import { PageSkeleton } from '@/components/page-skeleton/page-skeleton';
import { guardOutcome } from '@/components/require-auth/utils/guard-outcome';
import { ServerUnavailable } from '@/components/server-unavailable/server-unavailable';
import { useAuth } from '@/hooks/use-auth';

// Pathless layout route: everything below it needs an account.
export function RequireAuth() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const outcome = guardOutcome(auth.state, navigation.state);
  if (outcome === 'skeleton') return <PageSkeleton />;
  if (outcome === 'unavailable') return <ServerUnavailable onRetry={() => void auth.refresh()} />;
  if (outcome === 'sign-in') return <Navigate to={`/auth?next=${encodeURIComponent(pathname)}`} replace />;
  return <Outlet />;
}
