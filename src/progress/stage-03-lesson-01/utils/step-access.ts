import type { LessonElevenStepId } from '@/data/lessons/stage-03-lesson-01/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonElevenStepOrder } from '@/progress/stage-03-lesson-01/constants';
import type { LessonElevenProgress } from '@/progress/stage-03-lesson-01/types';
import { normalizeLessonElevenProgress } from '@/progress/stage-03-lesson-01/utils/parse-progress';

export function isLessonElevenStepReachable(progress: LessonElevenProgress, stepId: string): stepId is LessonElevenStepId {
  return isStepReachable(progress, stepId, lessonElevenStepOrder, normalizeLessonElevenProgress);
}

export function highestReachableLessonElevenStep(progress: LessonElevenProgress): LessonElevenStepId {
  return highestReachableStep(progress, lessonElevenStepOrder, normalizeLessonElevenProgress);
}
