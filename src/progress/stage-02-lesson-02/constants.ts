import type { LessonSevenStepId } from '@/data/lessons/stage-02-lesson-02/types';
import type { LessonSevenProgress } from '@/progress/stage-02-lesson-02/types';

export const lessonSevenId = 'stage-02-lesson-02';

export const lessonSevenSchemaVersion = 1;

export const lessonSevenContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonSevenStepOrder: readonly LessonSevenStepId[] = [
  'intro',
  'keys',
  'steps',
  'compare',
  'semitone',
  'deeper',
  'guitar',
  'checkpoint',
  'complete',
];

export const defaultLessonSevenProgress: LessonSevenProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
