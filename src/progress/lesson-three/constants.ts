import type { LessonThreeStepId } from '@/data/lessons/stage-01-lesson-03/types';
import type { LessonThreeProgress } from '@/progress/lesson-three/types';

export const lessonThreeId = 'stage-01-lesson-03';

export const lessonThreeSchemaVersion = 1;

export const lessonThreeContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonThreeStepOrder: readonly LessonThreeStepId[] = [
  'intro',
  'length',
  'tension',
  'density',
  'model',
  'checkpoint',
  'complete',
];

export const defaultLessonThreeProgress: LessonThreeProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
