import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hasMeaningfulLessonOneProgress,
  lessonOneGuestStorageKey,
  lessonOnePreferencesStorageKey,
  lessonOneProgressFingerprint,
  lessonOneUserStorageKey,
  mergeLessonOneProgress,
  parseLessonOneProgress,
  readLessonOneProgress,
  toSyncedLessonOneProgress,
  writeLessonOneProgress,
} from '../src/progress/lesson-one.ts';

afterEach(() => vi.unstubAllGlobals());

describe('Lesson 1 progress adapter', () => {
  it('migrates the legacy local shape and preserves completion through corrupt navigation data', () => {
    const progress = parseLessonOneProgress({
      currentStepId: 'future-step',
      completedStepIds: ['intro', 'future-step'],
      checkpointPassed: false,
      completedAt: '2026-09-16T12:00:00+03:00',
      audioEnabled: true,
      prefersStatic: true,
    });

    expect(progress).toEqual({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'checkpoint', 'complete'],
      checkpointPassed: true,
      completedAt: '2026-09-16T09:00:00.000Z',
      audioEnabled: true,
      prefersStatic: true,
    });
  });

  it('merges account progress monotonically while keeping preferences device-local', () => {
    const local = parseLessonOneProgress({
      currentStepId: 'air',
      completedStepIds: ['intro', 'string'],
      checkpointPassed: false,
      audioEnabled: true,
      prefersStatic: true,
    });
    const merged = mergeLessonOneProgress(local, {
      currentStepId: 'checkpoint',
      completedStepIds: ['intro', 'string', 'air'],
      checkpointPassed: false,
      completedAt: null,
    });

    expect(merged).toMatchObject({
      currentStepId: 'checkpoint',
      completedStepIds: ['intro', 'string', 'air'],
      audioEnabled: true,
      prefersStatic: true,
    });
    expect(toSyncedLessonOneProgress(merged)).not.toHaveProperty('audioEnabled');
    expect(toSyncedLessonOneProgress(merged)).not.toHaveProperty('prefersStatic');
  });

  it('uses separate account caches and stable guest-import fingerprints', () => {
    const progress = parseLessonOneProgress({ currentStepId: 'string', completedStepIds: ['intro'] });
    expect(lessonOneUserStorageKey('user/one')).not.toBe(lessonOneUserStorageKey('user/two'));
    expect(lessonOneUserStorageKey('user/one')).toContain('user%2Fone');
    expect(hasMeaningfulLessonOneProgress(progress)).toBe(true);
    expect(lessonOneProgressFingerprint(progress)).toBe(lessonOneProgressFingerprint({ ...progress, audioEnabled: true }));
  });

  it('keeps valid completion when the independent preference record is corrupt', () => {
    const values = new Map<string, string>([
      [lessonOneGuestStorageKey, JSON.stringify({
        currentStepId: 'complete',
        completedStepIds: ['intro', 'string', 'air', 'checkpoint', 'complete'],
        checkpointPassed: true,
        completedAt: '2026-09-16T12:00:00.000Z',
      })],
      [lessonOnePreferencesStorageKey, '{broken'],
    ]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });

    const restored = readLessonOneProgress(lessonOneGuestStorageKey);
    expect(restored).toMatchObject({
      storageAvailable: true,
      progress: { currentStepId: 'complete', checkpointPassed: true, audioEnabled: false, prefersStatic: false },
    });
    expect(writeLessonOneProgress(lessonOneGuestStorageKey, { ...restored.progress, prefersStatic: true })).toBe(true);
    expect(JSON.parse(values.get(lessonOneGuestStorageKey) ?? '{}')).toMatchObject({
      currentStepId: 'complete',
      completedAt: '2026-09-16T12:00:00.000Z',
    });
  });
});
