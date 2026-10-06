import type { LessonFiveStepId } from '@/data/lessons/stage-01-lesson-05/types';
import type { LessonFiveProgress } from '@/progress/lesson-five/types';

export const lessonFiveId = 'stage-01-lesson-05';

export const lessonFiveSchemaVersion = 1;

export const lessonFiveContentVersion = 1;

// One stable ID per screen; the same order is the server catalog's stepIds. The lesson
// is itself the check of Stage I, so there is no separate `checkpoint` step.
export const lessonFiveStepOrder: readonly LessonFiveStepId[] = [
  'intro',
  'higher',
  'lower',
  'timbre',
  'path',
  'complete',
];

// The four task screens; together they stand for the checkpoint the other lessons have.
export const lessonFiveCheckpointSteps: readonly LessonFiveStepId[] = ['higher', 'lower', 'timbre', 'path'];

export const defaultLessonFiveProgress: LessonFiveProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  checkpointPassed: false,
  completedAt: null,
};
