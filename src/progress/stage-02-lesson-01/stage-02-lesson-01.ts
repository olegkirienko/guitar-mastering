import type { LessonSixStepId } from '@/data/lessons/stage-02-lesson-01/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonSixProgress, lessonSixContentVersion, lessonSixId, lessonSixSchemaVersion, lessonSixStepOrder } from '@/progress/stage-02-lesson-01/constants';
import type { LessonSixProgress } from '@/progress/stage-02-lesson-01/types';
import { lessonSixProgressFingerprint, mergeLessonSixProgress, toSyncedLessonSixProgress } from '@/progress/stage-02-lesson-01/utils/merge-progress';
import { parseLessonSixProgress } from '@/progress/stage-02-lesson-01/utils/parse-progress';
import { highestReachableLessonSixStep, isLessonSixStepReachable } from '@/progress/stage-02-lesson-01/utils/step-access';

export const lessonSixProgressAdapter = {
  lessonId: lessonSixId,
  schemaVersion: lessonSixSchemaVersion,
  contentVersion: lessonSixContentVersion,
  stepOrder: lessonSixStepOrder,
  defaultProgress: defaultLessonSixProgress,
  parse: parseLessonSixProgress,
  toSynced: toSyncedLessonSixProgress,
  merge: mergeLessonSixProgress,
  fingerprint: lessonSixProgressFingerprint,
  isStepReachable: isLessonSixStepReachable,
  highestReachableStep: highestReachableLessonSixStep,
} satisfies LessonProgressAdapter<LessonSixStepId, LessonSixProgress>;
