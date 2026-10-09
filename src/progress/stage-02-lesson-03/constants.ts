import type { LessonEightStepId } from '@/data/lessons/stage-02-lesson-03/types';
import type { LessonEightProgress } from '@/progress/stage-02-lesson-03/types';

export const lessonEightId = 'stage-02-lesson-03';

export const lessonEightSchemaVersion = 1;

export const lessonEightContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonEightStepOrder: readonly LessonEightStepId[] = [
  'intro',
  'look',
  'pattern',
  'names',
  'anchor',
  'guitar',
  'checkpoint',
  'complete',
];

export const defaultLessonEightProgress: LessonEightProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
