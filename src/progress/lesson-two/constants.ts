import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import type { LessonTwoProgress } from '@/progress/lesson-two/types';

export const lessonTwoId = 'stage-01-lesson-02';

export const lessonTwoSchemaVersion = 1;

export const lessonTwoContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonTwoStepOrder: readonly LessonTwoStepId[] = [
  'intro',
  'string',
  'repeats',
  'frequency',
  'loudness',
  'guitar',
  'checkpoint',
  'complete',
];

export const defaultLessonTwoProgress: LessonTwoProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
