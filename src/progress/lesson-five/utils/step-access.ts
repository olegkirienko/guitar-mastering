import type { LessonFiveStepId } from '@/data/lessons/stage-01-lesson-05/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonFiveStepOrder } from '@/progress/lesson-five/constants';
import type { LessonFiveProgress } from '@/progress/lesson-five/types';
import { normalizeLessonFiveProgress } from '@/progress/lesson-five/utils/parse-progress';

export function isLessonFiveStepReachable(progress: LessonFiveProgress, stepId: string): stepId is LessonFiveStepId {
  return isStepReachable(progress, stepId, lessonFiveStepOrder, normalizeLessonFiveProgress);
}

export function highestReachableLessonFiveStep(progress: LessonFiveProgress): LessonFiveStepId {
  return highestReachableStep(progress, lessonFiveStepOrder, normalizeLessonFiveProgress);
}
