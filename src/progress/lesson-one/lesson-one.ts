import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { lessonOneContentVersion, lessonOneGuestStorageKey, lessonOneId, lessonOneSchemaVersion, lessonOneStepOrder } from '@/progress/lesson-one/constants';
import type { LessonOneProgress } from '@/progress/lesson-one/types';
import { hasMeaningfulLessonOneProgress, lessonOneProgressFingerprint, mergeLessonOneProgress, toSyncedLessonOneProgress } from '@/progress/lesson-one/utils/merge-progress';
import { parseLessonOneProgress } from '@/progress/lesson-one/utils/parse-progress';
import { highestReachableLessonOneStep, isLessonOneStepReachable } from '@/progress/lesson-one/utils/step-access';
import { readLessonOneProgress, writeLessonOneProgress } from '@/progress/lesson-one/utils/storage';
import { lessonOneImportDecisionKey, lessonOneUserStorageKey } from '@/progress/lesson-one/utils/storage-keys';

export const lessonOneProgressAdapter = {
  lessonId: lessonOneId,
  schemaVersion: lessonOneSchemaVersion,
  contentVersion: lessonOneContentVersion,
  stepOrder: lessonOneStepOrder,
  guestStorageKey: lessonOneGuestStorageKey,
  userStorageKey: lessonOneUserStorageKey,
  importDecisionKey: lessonOneImportDecisionKey,
  read: readLessonOneProgress,
  write: writeLessonOneProgress,
  parse: parseLessonOneProgress,
  toSynced: toSyncedLessonOneProgress,
  merge: mergeLessonOneProgress,
  hasMeaningfulProgress: hasMeaningfulLessonOneProgress,
  fingerprint: lessonOneProgressFingerprint,
  isStepReachable: isLessonOneStepReachable,
  highestReachableStep: highestReachableLessonOneStep,
} satisfies LessonProgressAdapter<LessonOneStepId, LessonOneProgress>;
