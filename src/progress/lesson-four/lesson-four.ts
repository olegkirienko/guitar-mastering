import type { LessonFourStepId } from '@/data/lessons/stage-01-lesson-04/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonFourProgress, lessonFourContentVersion, lessonFourId, lessonFourSchemaVersion, lessonFourStepOrder } from '@/progress/lesson-four/constants';
import type { LessonFourProgress } from '@/progress/lesson-four/types';
import { lessonFourProgressFingerprint, mergeLessonFourProgress, toSyncedLessonFourProgress } from '@/progress/lesson-four/utils/merge-progress';
import { parseLessonFourProgress } from '@/progress/lesson-four/utils/parse-progress';
import { highestReachableLessonFourStep, isLessonFourStepReachable } from '@/progress/lesson-four/utils/step-access';

export const lessonFourProgressAdapter = {
  lessonId: lessonFourId,
  schemaVersion: lessonFourSchemaVersion,
  contentVersion: lessonFourContentVersion,
  stepOrder: lessonFourStepOrder,
  defaultProgress: defaultLessonFourProgress,
  parse: parseLessonFourProgress,
  toSynced: toSyncedLessonFourProgress,
  merge: mergeLessonFourProgress,
  fingerprint: lessonFourProgressFingerprint,
  isStepReachable: isLessonFourStepReachable,
  highestReachableStep: highestReachableLessonFourStep,
} satisfies LessonProgressAdapter<LessonFourStepId, LessonFourProgress>;
