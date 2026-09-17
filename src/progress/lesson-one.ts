import { mergeProgress, type ProgressValue } from '@/progress/core';
import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01';

export const lessonOneId = 'stage-01-lesson-01';
export const lessonOneSchemaVersion = 1;
export const lessonOneContentVersion = 1;
export const lessonOneStepOrder: readonly LessonOneStepId[] = ['intro', 'string', 'air', 'checkpoint', 'complete'];
export const lessonOneGuestStorageKey = 'guitar-mastering:stage-01-lesson-01';
export const lessonOnePreferencesStorageKey = 'guitar-mastering:lesson-preferences';

export type LessonOneProgress = ProgressValue<LessonOneStepId> & {
  audioEnabled: boolean;
  prefersStatic: boolean;
};

export const defaultLessonOneProgress: LessonOneProgress = {
  currentStepId: 'intro',
  completedStepIds: [],
  audioEnabled: false,
  prefersStatic: false,
  checkpointPassed: false,
  completedAt: null,
};

export function lessonOneUserStorageKey(userId: string): string {
  return `guitar-mastering:user:${encodeURIComponent(userId)}:${lessonOneId}`;
}

export function lessonOneImportDecisionKey(userId: string): string {
  return `${lessonOneUserStorageKey(userId)}:guest-import`;
}

function validStep(value: unknown): value is LessonOneStepId {
  return typeof value === 'string' && lessonOneStepOrder.includes(value as LessonOneStepId);
}

export function parseLessonOneProgress(value: unknown): LessonOneProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultLessonOneProgress;
  const progress = value as Partial<LessonOneProgress>;
  const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt))
    ? new Date(progress.completedAt).toISOString()
    : null;
  const checkpointPassed = progress.checkpointPassed === true || completedAt !== null;
  const completedStepIds = Array.isArray(progress.completedStepIds)
    ? lessonOneStepOrder.filter((step) => progress.completedStepIds?.includes(step))
    : [];
  if (completedAt) {
    if (!completedStepIds.includes('checkpoint')) completedStepIds.push('checkpoint');
    if (!completedStepIds.includes('complete')) completedStepIds.push('complete');
  }
  const requestedStep = validStep(progress.currentStepId)
    ? progress.currentStepId
    : completedAt
      ? 'complete'
      : 'intro';
  return normalizeLessonOneProgress({
    currentStepId: requestedStep,
    completedStepIds,
    checkpointPassed,
    completedAt,
    audioEnabled: progress.audioEnabled === true,
    prefersStatic: progress.prefersStatic === true,
  });
}

export function normalizeLessonOneProgress(progress: LessonOneProgress): LessonOneProgress {
  const completedStepIds = lessonOneStepOrder.filter((step) => progress.completedStepIds.includes(step));
  const checkpointPassed = progress.checkpointPassed || progress.completedAt !== null;
  const highestUnlocked = checkpointPassed
    ? 'complete'
    : completedStepIds.includes('air')
      ? 'checkpoint'
      : completedStepIds.includes('string')
        ? 'air'
        : completedStepIds.includes('intro')
          ? 'string'
          : 'intro';
  const requestedRank = lessonOneStepOrder.indexOf(progress.currentStepId);
  const unlockedRank = lessonOneStepOrder.indexOf(highestUnlocked);
  return {
    ...progress,
    currentStepId: lessonOneStepOrder[Math.min(requestedRank, unlockedRank)] ?? 'intro',
    completedStepIds,
    checkpointPassed,
  };
}

export function readLessonOneProgress(key: string): { progress: LessonOneProgress; storageAvailable: boolean } {
  let stored: string | null;
  let preferences: string | null;
  try {
    stored = localStorage.getItem(key);
    preferences = localStorage.getItem(lessonOnePreferencesStorageKey);
  } catch {
    return { progress: defaultLessonOneProgress, storageAvailable: false };
  }

  let savedProgress = defaultLessonOneProgress;
  if (stored) {
    try {
      savedProgress = parseLessonOneProgress(JSON.parse(stored) as unknown);
    } catch {
      savedProgress = defaultLessonOneProgress;
    }
  }
  if (!preferences) return { progress: savedProgress, storageAvailable: true };

  try {
    const parsedPreferences = JSON.parse(preferences) as unknown;
    if (!parsedPreferences || typeof parsedPreferences !== 'object' || Array.isArray(parsedPreferences)) {
      return { progress: { ...savedProgress, audioEnabled: false, prefersStatic: false }, storageAvailable: true };
    }
    const preferenceRecord = parsedPreferences as Record<string, unknown>;
    return {
      progress: {
        ...savedProgress,
        audioEnabled: preferenceRecord.audioEnabled === true,
        prefersStatic: preferenceRecord.prefersStatic === true,
      },
      storageAvailable: true,
    };
  } catch {
    return { progress: { ...savedProgress, audioEnabled: false, prefersStatic: false }, storageAvailable: true };
  }
}

export function writeLessonOneProgress(key: string, progress: LessonOneProgress): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(progress));
    localStorage.setItem(lessonOnePreferencesStorageKey, JSON.stringify({
      audioEnabled: progress.audioEnabled,
      prefersStatic: progress.prefersStatic,
    }));
    return true;
  } catch {
    return false;
  }
}

export function toSyncedLessonOneProgress(progress: LessonOneProgress): ProgressValue<LessonOneStepId> {
  return {
    currentStepId: progress.currentStepId,
    completedStepIds: progress.completedStepIds,
    checkpointPassed: progress.checkpointPassed,
    completedAt: progress.completedAt,
  };
}

export function mergeLessonOneProgress(
  local: LessonOneProgress,
  remote: ProgressValue<LessonOneStepId>,
): LessonOneProgress {
  return normalizeLessonOneProgress({
    ...mergeProgress(toSyncedLessonOneProgress(local), remote, lessonOneStepOrder),
    audioEnabled: local.audioEnabled,
    prefersStatic: local.prefersStatic,
  });
}

export function hasMeaningfulLessonOneProgress(progress: LessonOneProgress): boolean {
  return progress.currentStepId !== 'intro'
    || progress.completedStepIds.length > 0
    || progress.checkpointPassed
    || progress.completedAt !== null;
}

export function lessonOneProgressFingerprint(progress: LessonOneProgress): string {
  return JSON.stringify(toSyncedLessonOneProgress(progress));
}
