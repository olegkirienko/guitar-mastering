import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonTwoStepOrder } from '@/progress/lesson-two/constants';
import type { LessonTwoProgress } from '@/progress/lesson-two/types';
import { normalizeLessonTwoProgress } from '@/progress/lesson-two/utils/parse-progress';

export function isLessonTwoStepReachable(progress: LessonTwoProgress, stepId: string): stepId is LessonTwoStepId {
  return isStepReachable(progress, stepId, lessonTwoStepOrder, normalizeLessonTwoProgress);
}

export function highestReachableLessonTwoStep(progress: LessonTwoProgress): LessonTwoStepId {
  return highestReachableStep(progress, lessonTwoStepOrder, normalizeLessonTwoProgress);
}
