import { useEffect, useState } from 'react';
import type { CourseProgress } from '@/hooks/use-course-progress/types';
import type { ProgressItem } from '@/progress/core/types';
import { createProgressApi } from '@/progress/core/utils/progress-api';

// Progress of every lesson from one GET /api/v1/progress, loaded on mount.
export function useCourseProgress(enabled = true): CourseProgress {
  const [state, setState] = useState<{ status: CourseProgress['status']; items: ProgressItem[] }>({ status: enabled ? 'loading' : 'idle', items: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', items: [] });
      return;
    }
    let active = true;
    setState((current) => ({ ...current, status: 'loading' }));
    createProgressApi().list()
      .then((items) => { if (active) setState({ status: 'ready', items }); })
      .catch(() => { if (active) setState({ status: 'error', items: [] }); });
    return () => { active = false; };
  }, [enabled, attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
