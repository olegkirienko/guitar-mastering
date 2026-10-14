import type { LessonElevenStepId } from '@/data/lessons/stage-03-lesson-01/types';
import type { LessonElevenProgress } from '@/progress/stage-03-lesson-01/types';

export const lessonElevenId = 'stage-03-lesson-01';

export const lessonElevenSchemaVersion = 1;

export const lessonElevenContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonElevenStepOrder: readonly LessonElevenStepId[] = [
  'intro',
  'press',
  'twelve',
  'explorer',
  'guitar',
  'checkpoint',
  'complete',
];

export const defaultLessonElevenProgress: LessonElevenProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
