import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { useCourseProgress } from '@/hooks/use-course-progress/use-course-progress';
import { safeNextPath } from '@/pages/auth-page/utils/is-safe-next';
import { courseLessons } from '@/progress/course/constants';
import { resolveResumePath } from '@/progress/core/utils/resolve-resume-path';

export function useAuthPage() {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registered, setRegistered] = useState(false);
  const next = safeNextPath(searchParams.get('next'), window.location.origin);
  const signedIn = auth.state === 'authenticated';
  const course = useCourseProgress(signedIn && !registered && next === null);

  // Registration starts Lesson 1; sign-in (or an existing session) goes to `next` or the resume path.
  let target: string | null = null;
  if (signedIn && registered) target = `/lessons/${courseLessons[0]?.routeId ?? '01'}/intro`;
  else if (signedIn && next) target = next;
  else if (signedIn && course.status === 'ready') target = resolveResumePath(course.items, courseLessons);
  else if (signedIn && course.status === 'error') target = '/course';

  return { auth, mode, setMode, target, onAuthenticated: (kind: 'login' | 'register') => setRegistered(kind === 'register') };
}
