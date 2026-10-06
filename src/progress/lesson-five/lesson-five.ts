import type { LessonFiveStepId } from '@/data/lessons/stage-01-lesson-05/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonFiveProgress, lessonFiveContentVersion, lessonFiveId, lessonFiveSchemaVersion, lessonFiveStepOrder } from '@/progress/lesson-five/constants';
import type { LessonFiveProgress } from '@/progress/lesson-five/types';
import { lessonFiveProgressFingerprint, mergeLessonFiveProgress, toSyncedLessonFiveProgress } from '@/progress/lesson-five/utils/merge-progress';
import { parseLessonFiveProgress } from '@/progress/lesson-five/utils/parse-progress';
import { highestReachableLessonFiveStep, isLessonFiveStepReachable } from '@/progress/lesson-five/utils/step-access';

export const lessonFiveProgressAdapter = {
  lessonId: lessonFiveId,
  schemaVersion: lessonFiveSchemaVersion,
  contentVersion: lessonFiveContentVersion,
  stepOrder: lessonFiveStepOrder,
  defaultProgress: defaultLessonFiveProgress,
  parse: parseLessonFiveProgress,
  toSynced: toSyncedLessonFiveProgress,
  merge: mergeLessonFiveProgress,
  fingerprint: lessonFiveProgressFingerprint,
  isStepReachable: isLessonFiveStepReachable,
  highestReachableStep: highestReachableLessonFiveStep,
} satisfies LessonProgressAdapter<LessonFiveStepId, LessonFiveProgress>;
