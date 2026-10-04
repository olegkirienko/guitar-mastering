import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonOneProgress, lessonOneContentVersion, lessonOneId, lessonOneSchemaVersion, lessonOneStepOrder } from '@/progress/lesson-one/constants';
import type { LessonOneProgress } from '@/progress/lesson-one/types';
import { lessonOneProgressFingerprint, mergeLessonOneProgress, toSyncedLessonOneProgress } from '@/progress/lesson-one/utils/merge-progress';
import { parseLessonOneProgress } from '@/progress/lesson-one/utils/parse-progress';
import { highestReachableLessonOneStep, isLessonOneStepReachable } from '@/progress/lesson-one/utils/step-access';

export const lessonOneProgressAdapter = {
  lessonId: lessonOneId,
  schemaVersion: lessonOneSchemaVersion,
  contentVersion: lessonOneContentVersion,
  stepOrder: lessonOneStepOrder,
  defaultProgress: defaultLessonOneProgress,
  parse: parseLessonOneProgress,
  toSynced: toSyncedLessonOneProgress,
  merge: mergeLessonOneProgress,
  fingerprint: lessonOneProgressFingerprint,
  isStepReachable: isLessonOneStepReachable,
  highestReachableStep: highestReachableLessonOneStep,
} satisfies LessonProgressAdapter<LessonOneStepId, LessonOneProgress>;
