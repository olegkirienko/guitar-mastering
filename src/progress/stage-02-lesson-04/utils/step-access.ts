import type { LessonNineStepId } from '@/data/lessons/stage-02-lesson-04/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonNineStepOrder } from '@/progress/stage-02-lesson-04/constants';
import type { LessonNineProgress } from '@/progress/stage-02-lesson-04/types';
import { normalizeLessonNineProgress } from '@/progress/stage-02-lesson-04/utils/parse-progress';

export function isLessonNineStepReachable(progress: LessonNineProgress, stepId: string): stepId is LessonNineStepId {
  return isStepReachable(progress, stepId, lessonNineStepOrder, normalizeLessonNineProgress);
}

export function highestReachableLessonNineStep(progress: LessonNineProgress): LessonNineStepId {
  return highestReachableStep(progress, lessonNineStepOrder, normalizeLessonNineProgress);
}
