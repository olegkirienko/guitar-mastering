import type { LessonNineStepId } from '@/data/lessons/stage-02-lesson-04/types';
import type { LessonNineProgress } from '@/progress/stage-02-lesson-04/types';

export const lessonNineId = 'stage-02-lesson-04';

export const lessonNineSchemaVersion = 1;

export const lessonNineContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonNineStepOrder: readonly LessonNineStepId[] = [
  'intro',
  'raise',
  'lower',
  'same',
  'edges',
  'guitar',
  'checkpoint',
  'complete',
];

export const defaultLessonNineProgress: LessonNineProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
