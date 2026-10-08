import type { LessonSixStepId } from '@/data/lessons/stage-02-lesson-01/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonSixStepOrder } from '@/progress/stage-02-lesson-01/constants';
import type { LessonSixProgress } from '@/progress/stage-02-lesson-01/types';
import { normalizeLessonSixProgress } from '@/progress/stage-02-lesson-01/utils/parse-progress';

export function isLessonSixStepReachable(progress: LessonSixProgress, stepId: string): stepId is LessonSixStepId {
  return isStepReachable(progress, stepId, lessonSixStepOrder, normalizeLessonSixProgress);
}

export function highestReachableLessonSixStep(progress: LessonSixProgress): LessonSixStepId {
  return highestReachableStep(progress, lessonSixStepOrder, normalizeLessonSixProgress);
}
