import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonOneStepOrder } from '@/progress/lesson-one/constants';
import type { LessonOneProgress } from '@/progress/lesson-one/types';
import { normalizeLessonOneProgress } from '@/progress/lesson-one/utils/parse-progress';

export function isLessonOneStepReachable(progress: LessonOneProgress, stepId: string): stepId is LessonOneStepId {
  return isStepReachable(progress, stepId, lessonOneStepOrder, normalizeLessonOneProgress);
}

export function highestReachableLessonOneStep(progress: LessonOneProgress): LessonOneStepId {
  return highestReachableStep(progress, lessonOneStepOrder, normalizeLessonOneProgress);
}
