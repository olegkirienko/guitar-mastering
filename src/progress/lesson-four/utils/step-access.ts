import type { LessonFourStepId } from '@/data/lessons/stage-01-lesson-04/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonFourStepOrder } from '@/progress/lesson-four/constants';
import type { LessonFourProgress } from '@/progress/lesson-four/types';
import { normalizeLessonFourProgress } from '@/progress/lesson-four/utils/parse-progress';

export function isLessonFourStepReachable(progress: LessonFourProgress, stepId: string): stepId is LessonFourStepId {
  return isStepReachable(progress, stepId, lessonFourStepOrder, normalizeLessonFourProgress);
}

export function highestReachableLessonFourStep(progress: LessonFourProgress): LessonFourStepId {
  return highestReachableStep(progress, lessonFourStepOrder, normalizeLessonFourProgress);
}
