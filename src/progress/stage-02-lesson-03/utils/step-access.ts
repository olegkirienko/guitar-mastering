import type { LessonEightStepId } from '@/data/lessons/stage-02-lesson-03/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonEightStepOrder } from '@/progress/stage-02-lesson-03/constants';
import type { LessonEightProgress } from '@/progress/stage-02-lesson-03/types';
import { normalizeLessonEightProgress } from '@/progress/stage-02-lesson-03/utils/parse-progress';

export function isLessonEightStepReachable(progress: LessonEightProgress, stepId: string): stepId is LessonEightStepId {
  return isStepReachable(progress, stepId, lessonEightStepOrder, normalizeLessonEightProgress);
}

export function highestReachableLessonEightStep(progress: LessonEightProgress): LessonEightStepId {
  return highestReachableStep(progress, lessonEightStepOrder, normalizeLessonEightProgress);
}
