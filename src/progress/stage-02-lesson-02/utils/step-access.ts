import type { LessonSevenStepId } from '@/data/lessons/stage-02-lesson-02/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonSevenStepOrder } from '@/progress/stage-02-lesson-02/constants';
import type { LessonSevenProgress } from '@/progress/stage-02-lesson-02/types';
import { normalizeLessonSevenProgress } from '@/progress/stage-02-lesson-02/utils/parse-progress';

export function isLessonSevenStepReachable(progress: LessonSevenProgress, stepId: string): stepId is LessonSevenStepId {
  return isStepReachable(progress, stepId, lessonSevenStepOrder, normalizeLessonSevenProgress);
}

export function highestReachableLessonSevenStep(progress: LessonSevenProgress): LessonSevenStepId {
  return highestReachableStep(progress, lessonSevenStepOrder, normalizeLessonSevenProgress);
}
