import type { LessonSixStepId } from '@/data/lessons/stage-02-lesson-01/types';
import type { LessonSixProgress } from '@/progress/stage-02-lesson-01/types';

export const lessonSixId = 'stage-02-lesson-01';

export const lessonSixSchemaVersion = 1;

export const lessonSixContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonSixStepOrder: readonly LessonSixStepId[] = [
  'intro',
  'same-name',
  'doubler',
  'octave',
  'guitar',
  'checkpoint',
  'complete',
];

export const defaultLessonSixProgress: LessonSixProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
