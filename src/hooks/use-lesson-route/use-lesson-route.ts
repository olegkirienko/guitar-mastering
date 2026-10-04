import { type Dispatch, type SetStateAction, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useCourseProgress } from '@/hooks/use-course-progress/use-course-progress';
import type { LessonRoute } from '@/hooks/use-lesson-route/types';
import { courseLessons } from '@/progress/course/constants';
import type { LessonProgressAdapter, ProgressValue } from '@/progress/core/types';

type RouteProgress<Local> = {
  progress: Local;
  loaded: boolean;
  setProgress: Dispatch<SetStateAction<Local>>;
};

// Binds a lesson page to /lessons/:routeId/:stepId: the URL is the open step,
// the lesson gate and step reach decide redirects, and opening a step stores it as the position.
export function useLessonRoute<StepId extends string, Local extends ProgressValue<StepId>>(
  routeId: string,
  adapter: LessonProgressAdapter<StepId, Local>,
  { progress, loaded, setProgress }: RouteProgress<Local>,
) {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const course = useCourseProgress();
  const index = courseLessons.findIndex((lesson) => lesson.routeId === routeId);
  const lesson = courseLessons[index];
  const previous = courseLessons[index - 1];
  const ready = course.status === 'ready' && loaded;
  const openStep = stepId !== undefined && adapter.isStepReachable(progress, stepId) ? stepId : null;

  const currentStepId = progress.currentStepId;
  useEffect(() => {
    if (!ready || openStep === null || currentStepId === openStep) return;
    setProgress((current) => ({ ...current, currentStepId: openStep }));
  }, [ready, openStep, currentStepId, setProgress]);

  const goTo = useCallback((step: StepId) => { void navigate(`/lessons/${routeId}/${step}`); }, [navigate, routeId]);

  let route: LessonRoute<StepId>;
  if (course.status === 'error') route = { kind: 'unavailable', retry: course.retry };
  else if (!ready) route = { kind: 'loading' };
  else if (previous && !course.items.some((item) => item.lessonId === previous.lessonId && item.progress.completedAt !== null)) route = { kind: 'redirect', to: '/course' };
  else if (stepId === undefined) route = { kind: 'redirect', to: `/lessons/${routeId}/${progress.currentStepId}` };
  else if (openStep === null) route = { kind: 'redirect', to: `/lessons/${routeId}/${adapter.highestReachableStep(progress)}` };
  else route = {
    kind: 'ready',
    stepId: openStep,
    steps: (lesson?.steps ?? []).map((step) => ({
      ...step,
      href: `/lessons/${routeId}/${step.id}`,
      reachable: adapter.isStepReachable(progress, step.id),
    })),
  };

  return { route, goTo };
}
