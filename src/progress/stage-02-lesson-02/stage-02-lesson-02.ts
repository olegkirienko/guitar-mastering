import type { LessonSevenStepId } from '@/data/lessons/stage-02-lesson-02/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonSevenProgress, lessonSevenContentVersion, lessonSevenId, lessonSevenSchemaVersion, lessonSevenStepOrder } from '@/progress/stage-02-lesson-02/constants';
import type { LessonSevenProgress } from '@/progress/stage-02-lesson-02/types';
import { lessonSevenProgressFingerprint, mergeLessonSevenProgress, toSyncedLessonSevenProgress } from '@/progress/stage-02-lesson-02/utils/merge-progress';
import { parseLessonSevenProgress } from '@/progress/stage-02-lesson-02/utils/parse-progress';
import { highestReachableLessonSevenStep, isLessonSevenStepReachable } from '@/progress/stage-02-lesson-02/utils/step-access';

export const lessonSevenProgressAdapter = {
  lessonId: lessonSevenId,
  schemaVersion: lessonSevenSchemaVersion,
  contentVersion: lessonSevenContentVersion,
  stepOrder: lessonSevenStepOrder,
  defaultProgress: defaultLessonSevenProgress,
  parse: parseLessonSevenProgress,
  toSynced: toSyncedLessonSevenProgress,
  merge: mergeLessonSevenProgress,
  fingerprint: lessonSevenProgressFingerprint,
  isStepReachable: isLessonSevenStepReachable,
  highestReachableStep: highestReachableLessonSevenStep,
} satisfies LessonProgressAdapter<LessonSevenStepId, LessonSevenProgress>;
