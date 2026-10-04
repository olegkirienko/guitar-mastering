import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import type { LessonOneProgress } from '@/progress/lesson-one/types';

export const lessonOneId = 'stage-01-lesson-01';

export const lessonOneSchemaVersion = 1;

export const lessonOneContentVersion = 1;

export const lessonOneStepOrder: readonly LessonOneStepId[] = ['intro', 'string', 'air', 'checkpoint', 'complete'];

export const defaultLessonOneProgress: LessonOneProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
