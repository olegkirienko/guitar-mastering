import type { LessonTwelveStepId } from '@/data/lessons/stage-03-lesson-02/types';
import type { LessonTwelveProgress } from '@/progress/stage-03-lesson-02/types';

export const lessonTwelveId = 'stage-03-lesson-02';

export const lessonTwelveSchemaVersion = 1;

export const lessonTwelveContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonTwelveStepOrder: readonly LessonTwelveStepId[] = [
  'intro',
  'strings',
  'link',
  'pattern',
  'guitar',
  'checkpoint',
  'complete',
];

export const defaultLessonTwelveProgress: LessonTwelveProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
