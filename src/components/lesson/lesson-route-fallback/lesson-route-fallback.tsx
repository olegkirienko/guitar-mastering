import { Navigate } from 'react-router';
import { PageSkeleton } from '@/components/page-skeleton/page-skeleton';
import { ServerUnavailable } from '@/components/server-unavailable/server-unavailable';
import type { LessonRoute } from '@/hooks/use-lesson-route/types';

type PendingRoute = Exclude<LessonRoute<string>, { kind: 'ready' }>;

export function LessonRouteFallback({ route }: { route: PendingRoute }) {
  if (route.kind === 'redirect') return <Navigate to={route.to} replace />;
  if (route.kind === 'unavailable') return <ServerUnavailable onRetry={route.retry} />;
  return <PageSkeleton />;
}
