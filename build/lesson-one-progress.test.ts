import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasMeaningfulLessonOneProgress, lessonOneProgressFingerprint, mergeLessonOneProgress, toSyncedLessonOneProgress } from '../src/progress/lesson-one/utils/merge-progress.ts';
import { defaultLessonOneProgress, lessonOneGuestStorageKey, lessonOnePreferencesStorageKey } from '../src/progress/lesson-one/constants.ts';
import { lessonOneProgressAdapter } from '../src/progress/lesson-one/lesson-one.ts';
import { lessonOneUserStorageKey } from '../src/progress/lesson-one/utils/storage-keys.ts';
import { parseLessonOneProgress } from '../src/progress/lesson-one/utils/parse-progress.ts';
import { readLessonOneProgress, writeLessonOneProgress } from '../src/progress/lesson-one/utils/storage.ts';
import type { LessonProgressAdapter } from '../src/progress/core/types.ts';

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

  it('merges account reach monotonically, keeps the local position and device-local preferences', () => {
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
      currentStepId: 'air',
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

  it('exposes a stable adapter while another lesson keeps independent storage identity', () => {
    const secondAdapter = {
      ...lessonOneProgressAdapter,
      lessonId: 'test-lesson-two',
      guestStorageKey: 'guitar-mastering:test-lesson-two',
      userStorageKey: (userId: string) => `guitar-mastering:user:${encodeURIComponent(userId)}:test-lesson-two`,
      importDecisionKey: (userId: string) => `guitar-mastering:user:${encodeURIComponent(userId)}:test-lesson-two:guest-import`,
    } satisfies LessonProgressAdapter<'intro' | 'string' | 'air' | 'checkpoint' | 'complete', typeof defaultLessonOneProgress>;

    expect(lessonOneProgressAdapter.lessonId).toBe('stage-01-lesson-01');
    expect(lessonOneProgressAdapter.guestStorageKey).toBe(lessonOneGuestStorageKey);
    expect(lessonOneProgressAdapter.userStorageKey('user/one')).toBe(lessonOneUserStorageKey('user/one'));
    expect(secondAdapter.guestStorageKey).not.toBe(lessonOneProgressAdapter.guestStorageKey);
    expect(secondAdapter.userStorageKey('user/one')).not.toBe(lessonOneProgressAdapter.userStorageKey('user/one'));
    expect(secondAdapter.importDecisionKey('user/one')).not.toBe(lessonOneProgressAdapter.importDecisionKey('user/one'));
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
