import type { LessonTenStepId } from '@/data/lessons/stage-02-lesson-05/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonTenStepOrder } from '@/progress/stage-02-lesson-05/constants';
import type { LessonTenProgress } from '@/progress/stage-02-lesson-05/types';
import { normalizeLessonTenProgress } from '@/progress/stage-02-lesson-05/utils/parse-progress';

export function isLessonTenStepReachable(progress: LessonTenProgress, stepId: string): stepId is LessonTenStepId {
  return isStepReachable(progress, stepId, lessonTenStepOrder, normalizeLessonTenProgress);
}

export function highestReachableLessonTenStep(progress: LessonTenProgress): LessonTenStepId {
  return highestReachableStep(progress, lessonTenStepOrder, normalizeLessonTenProgress);
}
