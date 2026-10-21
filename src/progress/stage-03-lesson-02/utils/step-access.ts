import type { LessonTwelveStepId } from '@/data/lessons/stage-03-lesson-02/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonTwelveStepOrder } from '@/progress/stage-03-lesson-02/constants';
import type { LessonTwelveProgress } from '@/progress/stage-03-lesson-02/types';
import { normalizeLessonTwelveProgress } from '@/progress/stage-03-lesson-02/utils/parse-progress';

export function isLessonTwelveStepReachable(progress: LessonTwelveProgress, stepId: string): stepId is LessonTwelveStepId {
  return isStepReachable(progress, stepId, lessonTwelveStepOrder, normalizeLessonTwelveProgress);
}

export function highestReachableLessonTwelveStep(progress: LessonTwelveProgress): LessonTwelveStepId {
  return highestReachableStep(progress, lessonTwelveStepOrder, normalizeLessonTwelveProgress);
}
