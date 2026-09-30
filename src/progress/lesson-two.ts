import { mergeProgress, type LessonProgressAdapter, type ProgressValue } from '@/progress/core';
import { lessonOnePreferencesStorageKey } from '@/progress/lesson-one';
import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02';

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

export type LessonTwoProgress = ProgressValue<LessonTwoStepId> & {
  audioEnabled: boolean;
  prefersStatic: boolean;
};

export const defaultLessonTwoProgress: LessonTwoProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  audioEnabled: false,
  prefersStatic: false,
  checkpointPassed: false,
  completedAt: null,
};

export function lessonTwoUserStorageKey(userId: string): string {
  return `guitar-mastering:user:${encodeURIComponent(userId)}:${lessonTwoId}`;
}

export function lessonTwoImportDecisionKey(userId: string): string {
  return `${lessonTwoUserStorageKey(userId)}:guest-import`;
}

function validStep(value: unknown): value is LessonTwoStepId {
  return typeof value === 'string' && lessonTwoStepOrder.includes(value as LessonTwoStepId);
}

// Each completed step unlocks the next one in order; `complete` unlocks only
// once the checkpoint rules set checkpointPassed.
function highestUnlockedStep(completedStepIds: readonly LessonTwoStepId[], checkpointPassed: boolean): LessonTwoStepId {
  if (checkpointPassed) return 'complete';
  let unlocked: LessonTwoStepId = 'intro';
  for (const [index, step] of lessonTwoStepOrder.entries()) {
    if (step === 'checkpoint' || !completedStepIds.includes(step)) break;
    unlocked = lessonTwoStepOrder[index + 1];
  }
  return unlocked;
}

export function parseLessonTwoProgress(value: unknown): LessonTwoProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonTwoProgress;
  const progress = value as Partial<LessonTwoProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonTwoStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonTwoProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed: progress.checkpointPassed === true,
    completedAt,
    audioEnabled: progress.audioEnabled === true,
    prefersStatic: progress.prefersStatic === true,
  });
}

export function normalizeLessonTwoProgress(progress: LessonTwoProgress): LessonTwoProgress {
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const completed = new Set(progress.completedStepIds);
  if (progress.completedAt !== null) {
    completed.add('checkpoint');
    completed.add('complete');
  }
  const completedStepIds = lessonTwoStepOrder.filter((step) => completed.has(step));
  const unlockedRank = lessonTwoStepOrder.indexOf(highestUnlockedStep(completedStepIds, checkpointPassed));
  const requestedRank = lessonTwoStepOrder.indexOf(progress.currentStepId);
  return {
    ...progress,
    currentStepId: lessonTwoStepOrder[Math.min(requestedRank === -1 ? 0 : requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}

function readPreferences(raw: string | null): Pick<LessonTwoProgress, 'audioEnabled' | 'prefersStatic'> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { audioEnabled: false, prefersStatic: false };
    const record = parsed as Record<string, unknown>;
    return { audioEnabled: record.audioEnabled === true, prefersStatic: record.prefersStatic === true };
  } catch {
    return { audioEnabled: false, prefersStatic: false };
  }
}

export function readLessonTwoProgress(key: string): { progress: LessonTwoProgress; storageAvailable: boolean } {
  let stored: string | null;
  let preferences: string | null;
  try {
    stored = localStorage.getItem(key);
    preferences = localStorage.getItem(lessonTwoPreferencesStorageKey);
  } catch {
    return { progress: defaultLessonTwoProgress, storageAvailable: false };
  }

  let savedProgress = defaultLessonTwoProgress;
  if (stored) {
    try {
      savedProgress = parseLessonTwoProgress(JSON.parse(stored) as unknown);
    } catch {
      savedProgress = defaultLessonTwoProgress;
    }
  }
  const sharedPreferences = readPreferences(preferences);
  return {
    progress: sharedPreferences ? { ...savedProgress, ...sharedPreferences } : savedProgress,
    storageAvailable: true,
  };
}

export function writeLessonTwoProgress(key: string, progress: LessonTwoProgress): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(progress));
    localStorage.setItem(lessonTwoPreferencesStorageKey, JSON.stringify({
      audioEnabled: progress.audioEnabled,
      prefersStatic: progress.prefersStatic,
    }));
    return true;
  } catch {
    return false;
  }
}

export function toSyncedLessonTwoProgress(progress: LessonTwoProgress): ProgressValue<LessonTwoStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonTwoProgress(
  local: LessonTwoProgress,
  remote: ProgressValue<LessonTwoStepId>,
): LessonTwoProgress {
  return normalizeLessonTwoProgress({
    ...mergeProgress(toSyncedLessonTwoProgress(local), remote, lessonTwoStepOrder),
    audioEnabled: local.audioEnabled,
    prefersStatic: local.prefersStatic,
  });
}

export function hasMeaningfulLessonTwoProgress(progress: LessonTwoProgress): boolean {
  return progress.currentStepId !== 'intro'
    || progress.completedStepIds.length > 0
    || progress.checkpointPassed
    || progress.completedAt !== null;
}

export function lessonTwoProgressFingerprint(progress: LessonTwoProgress): string {
  return JSON.stringify(toSyncedLessonTwoProgress(progress));
}

export const lessonTwoProgressAdapter = {
  lessonId: lessonTwoId,
  schemaVersion: lessonTwoSchemaVersion,
  contentVersion: lessonTwoContentVersion,
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
} satisfies LessonProgressAdapter<LessonTwoStepId, LessonTwoProgress>;
