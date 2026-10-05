import type { LessonFourStepId } from '@/data/lessons/stage-01-lesson-04/types';
import type { LessonFourProgress } from '@/progress/lesson-four/types';

export const lessonFourId = 'stage-01-lesson-04';

export const lessonFourSchemaVersion = 1;

export const lessonFourContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonFourStepOrder: readonly LessonFourStepId[] = [
  'intro',
  'shape',
  'overtones',
  'spectrum',
  'envelope',
  'checkpoint',
  'complete',
];

export const defaultLessonFourProgress: LessonFourProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
