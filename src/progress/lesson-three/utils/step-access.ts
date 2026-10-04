import type { LessonThreeStepId } from '@/data/lessons/stage-01-lesson-03/types';
import { highestReachableStep, isStepReachable } from '@/progress/core/utils/step-access';
import { lessonThreeStepOrder } from '@/progress/lesson-three/constants';
import type { LessonThreeProgress } from '@/progress/lesson-three/types';
import { normalizeLessonThreeProgress } from '@/progress/lesson-three/utils/parse-progress';

export function isLessonThreeStepReachable(progress: LessonThreeProgress, stepId: string): stepId is LessonThreeStepId {
  return isStepReachable(progress, stepId, lessonThreeStepOrder, normalizeLessonThreeProgress);
}

export function highestReachableLessonThreeStep(progress: LessonThreeProgress): LessonThreeStepId {
  return highestReachableStep(progress, lessonThreeStepOrder, normalizeLessonThreeProgress);
}
