import { defaultLessonTwoProgress, lessonTwoPreferencesStorageKey } from '@/progress/lesson-two/constants';
import type { LessonTwoProgress } from '@/progress/lesson-two/types';
import { parseLessonTwoProgress } from '@/progress/lesson-two/utils/parse-progress';

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
