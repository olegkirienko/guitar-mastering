import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import type { ProgressValue } from '@/progress/core/types';

export type LessonTwoProgress = ProgressValue<LessonTwoStepId> & {
  audioEnabled: boolean;
  prefersStatic: boolean;
};
