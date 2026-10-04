import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { lessonTwoContentVersion, lessonTwoGuestStorageKey, lessonTwoId, lessonTwoSchemaVersion, lessonTwoStepOrder } from '@/progress/lesson-two/constants';
import type { LessonTwoProgress } from '@/progress/lesson-two/types';
import { hasMeaningfulLessonTwoProgress, lessonTwoProgressFingerprint, mergeLessonTwoProgress, toSyncedLessonTwoProgress } from '@/progress/lesson-two/utils/merge-progress';
import { parseLessonTwoProgress } from '@/progress/lesson-two/utils/parse-progress';
import { highestReachableLessonTwoStep, isLessonTwoStepReachable } from '@/progress/lesson-two/utils/step-access';
import { readLessonTwoProgress, writeLessonTwoProgress } from '@/progress/lesson-two/utils/storage';
import { lessonTwoImportDecisionKey, lessonTwoUserStorageKey } from '@/progress/lesson-two/utils/storage-keys';

export const lessonTwoProgressAdapter = {
  lessonId: lessonTwoId,
  schemaVersion: lessonTwoSchemaVersion,
  contentVersion: lessonTwoContentVersion,
  stepOrder: lessonTwoStepOrder,
  guestStorageKey: lessonTwoGuestStorageKey,
  userStorageKey: lessonTwoUserStorageKey,
  importDecisionKey: lessonTwoImportDecisionKey,
  read: readLessonTwoProgress,
  write: writeLessonTwoProgress,
  parse: parseLessonTwoProgress,
  toSynced: toSyncedLessonTwoProgress,
  merge: mergeLessonTwoProgress,
  hasMeaningfulProgress: hasMeaningfulLessonTwoProgress,
  fingerprint: lessonTwoProgressFingerprint,
  isStepReachable: isLessonTwoStepReachable,
  highestReachableStep: highestReachableLessonTwoStep,
} satisfies LessonProgressAdapter<LessonTwoStepId, LessonTwoProgress>;
