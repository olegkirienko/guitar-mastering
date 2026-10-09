import type { LessonTenStepId } from '@/data/lessons/stage-02-lesson-05/types';
import type { LessonTenProgress } from '@/progress/stage-02-lesson-05/types';

export const lessonTenId = 'stage-02-lesson-05';

export const lessonTenSchemaVersion = 1;

export const lessonTenContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds.
export const lessonTenStepOrder: readonly LessonTenStepId[] = [
  'intro',
  'octave',
  'count',
  'gaps',
  'walk',
  'guitar',
  'complete',
];

export const defaultLessonTenProgress: LessonTenProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
