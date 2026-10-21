import type { LessonTwelveStepId } from '@/data/lessons/stage-03-lesson-02/types';
import type { LessonProgressAdapter } from '@/progress/core/types';
import { defaultLessonTwelveProgress, lessonTwelveContentVersion, lessonTwelveId, lessonTwelveSchemaVersion, lessonTwelveStepOrder } from '@/progress/stage-03-lesson-02/constants';
import type { LessonTwelveProgress } from '@/progress/stage-03-lesson-02/types';
import { lessonTwelveProgressFingerprint, mergeLessonTwelveProgress, toSyncedLessonTwelveProgress } from '@/progress/stage-03-lesson-02/utils/merge-progress';
import { parseLessonTwelveProgress } from '@/progress/stage-03-lesson-02/utils/parse-progress';
import { highestReachableLessonTwelveStep, isLessonTwelveStepReachable } from '@/progress/stage-03-lesson-02/utils/step-access';

export const lessonTwelveProgressAdapter = {
  lessonId: lessonTwelveId,
  schemaVersion: lessonTwelveSchemaVersion,
  contentVersion: lessonTwelveContentVersion,
  stepOrder: lessonTwelveStepOrder,
  defaultProgress: defaultLessonTwelveProgress,
  parse: parseLessonTwelveProgress,
  toSynced: toSyncedLessonTwelveProgress,
  merge: mergeLessonTwelveProgress,
  fingerprint: lessonTwelveProgressFingerprint,
  isStepReachable: isLessonTwelveStepReachable,
  highestReachableStep: highestReachableLessonTwelveStep,
} satisfies LessonProgressAdapter<LessonTwelveStepId, LessonTwelveProgress>;
