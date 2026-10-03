import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import { lessonOnePreferencesStorageKey } from '@/progress/lesson-one/constants';
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

export const lessonTwoGuestStorageKey = 'guitar-mastering:stage-01-lesson-02';

// Audio and step-by-step viewing are global lesson preferences shared with Lesson 1.
export const lessonTwoPreferencesStorageKey = lessonOnePreferencesStorageKey;

export const defaultLessonTwoProgress: LessonTwoProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  audioEnabled: false,
  prefersStatic: false,
  checkpointPassed: false,
  completedAt: null,
};
