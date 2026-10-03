import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import type { ProgressValue } from '@/progress/core/types';

export type LessonOneProgress = ProgressValue<LessonOneStepId> & {
  audioEnabled: boolean;
  prefersStatic: boolean;
};
