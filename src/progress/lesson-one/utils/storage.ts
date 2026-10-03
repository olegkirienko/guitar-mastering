import { defaultLessonOneProgress, lessonOnePreferencesStorageKey } from '@/progress/lesson-one/constants';
import type { LessonOneProgress } from '@/progress/lesson-one/types';
import { parseLessonOneProgress } from '@/progress/lesson-one/utils/parse-progress';

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
