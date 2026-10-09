import type { LessonNineStepId } from '@/data/lessons/stage-02-lesson-04/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonNineProgress, lessonNineContentVersion, lessonNineId, lessonNineSchemaVersion, lessonNineStepOrder } from '@/progress/stage-02-lesson-04/constants';
import type { LessonNineProgress } from '@/progress/stage-02-lesson-04/types';
import { lessonNineProgressFingerprint, mergeLessonNineProgress, toSyncedLessonNineProgress } from '@/progress/stage-02-lesson-04/utils/merge-progress';
import { parseLessonNineProgress } from '@/progress/stage-02-lesson-04/utils/parse-progress';
import { highestReachableLessonNineStep, isLessonNineStepReachable } from '@/progress/stage-02-lesson-04/utils/step-access';

export const lessonNineProgressAdapter = {
  lessonId: lessonNineId,
  schemaVersion: lessonNineSchemaVersion,
  contentVersion: lessonNineContentVersion,
  stepOrder: lessonNineStepOrder,
  defaultProgress: defaultLessonNineProgress,
  parse: parseLessonNineProgress,
  toSynced: toSyncedLessonNineProgress,
  merge: mergeLessonNineProgress,
  fingerprint: lessonNineProgressFingerprint,
  isStepReachable: isLessonNineStepReachable,
  highestReachableStep: highestReachableLessonNineStep,
} satisfies LessonProgressAdapter<LessonNineStepId, LessonNineProgress>;
