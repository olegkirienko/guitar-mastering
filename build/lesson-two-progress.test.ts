import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defaultLessonTwoProgress,
  lessonTwoGuestStorageKey,
  lessonTwoPreferencesStorageKey,
  lessonTwoProgressAdapter,
  lessonTwoStepOrder,
  lessonTwoUserStorageKey,
  mergeLessonTwoProgress,
  parseLessonTwoProgress,
  readLessonTwoProgress,
  toSyncedLessonTwoProgress,
  writeLessonTwoProgress,
} from '../src/progress/lesson-two.ts';
import {
  lessonOneGuestStorageKey,
  lessonOneUserStorageKey,
  readLessonOneProgress,
  writeLessonOneProgress,
  defaultLessonOneProgress,
} from '../src/progress/lesson-one.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    values,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('Lesson 2 progress adapter', () => {
  it('uses the server catalog step order and its own storage identity', () => {
    expect(productionProgressCatalog.get('stage-01-lesson-02')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonTwoStepOrder],
    });
    expect(lessonTwoProgressAdapter.lessonId).toBe('stage-01-lesson-02');
    expect(lessonTwoGuestStorageKey).not.toBe(lessonOneGuestStorageKey);
    expect(lessonTwoUserStorageKey('user-1')).not.toBe(lessonOneUserStorageKey('user-1'));
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonTwoProgress({
      currentStepId: 'frequency',
      completedStepIds: ['intro', 'string', 'repeats'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('frequency');
    expect(parseLessonTwoProgress({
      currentStepId: 'guitar',
      completedStepIds: ['intro', 'repeats'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('string');
    const tampered = parseLessonTwoProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonTwoStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonTwoProgress({
      currentStepId: 'future-step',
      completedStepIds: ['intro', 'air', 'future-step'],
      checkpointPassed: false,
      completedAt: '2026-09-30T12:00:00+03:00',
      audioEnabled: true,
      prefersStatic: 'yes',
    });
    expect(progress).toEqual({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'checkpoint', 'complete'],
      checkpointPassed: true,
      completedAt: '2026-09-30T09:00:00.000Z',
      audioEnabled: true,
      prefersStatic: false,
    });
    expect(parseLessonTwoProgress('corrupt')).toEqual(defaultLessonTwoProgress);
    expect(parseLessonTwoProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically while keeping local preferences', () => {
    const local = { ...defaultLessonTwoProgress, currentStepId: 'repeats' as const, completedStepIds: ['intro', 'string'] as ('intro' | 'string')[], audioEnabled: true };
    expect(Object.keys(toSyncedLessonTwoProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonTwoProgress(local, {
      currentStepId: 'string',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('repeats');
    expect(merged.completedStepIds).toEqual(['intro', 'string']);
    expect(merged.audioEnabled).toBe(true);
  });

  it('shares the preference record with Lesson 1 in both directions', () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    writeLessonTwoProgress(lessonTwoGuestStorageKey, { ...defaultLessonTwoProgress, audioEnabled: true, prefersStatic: true });
    expect(storage.values.has(lessonTwoPreferencesStorageKey)).toBe(true);
    expect(readLessonOneProgress(lessonOneGuestStorageKey).progress).toMatchObject({ audioEnabled: true, prefersStatic: true });

    writeLessonOneProgress(lessonOneGuestStorageKey, { ...defaultLessonOneProgress, audioEnabled: false, prefersStatic: true });
    expect(readLessonTwoProgress(lessonTwoGuestStorageKey).progress).toMatchObject({ audioEnabled: false, prefersStatic: true });
    expect(JSON.parse(storage.values.get(lessonTwoGuestStorageKey) ?? '{}')).toMatchObject({ currentStepId: 'intro' });
  });

  it('reports unavailable storage and falls back from corrupt stored progress', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(readLessonTwoProgress(lessonTwoGuestStorageKey)).toEqual({ progress: defaultLessonTwoProgress, storageAvailable: false });
    expect(writeLessonTwoProgress(lessonTwoGuestStorageKey, defaultLessonTwoProgress)).toBe(false);

    const storage = memoryStorage();
    storage.setItem(lessonTwoGuestStorageKey, '{not json');
    storage.setItem(lessonTwoPreferencesStorageKey, '[]');
    vi.stubGlobal('localStorage', storage);
    expect(readLessonTwoProgress(lessonTwoGuestStorageKey)).toEqual({ progress: defaultLessonTwoProgress, storageAvailable: true });
  });
});
