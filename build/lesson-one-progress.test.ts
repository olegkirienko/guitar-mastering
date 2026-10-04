import { describe, expect, it } from 'vitest';
import { lessonOneProgressFingerprint, mergeLessonOneProgress, toSyncedLessonOneProgress } from '../src/progress/lesson-one/utils/merge-progress.ts';
import { defaultLessonOneProgress } from '../src/progress/lesson-one/constants.ts';
import { lessonOneProgressAdapter } from '../src/progress/lesson-one/lesson-one.ts';
import { parseLessonOneProgress } from '../src/progress/lesson-one/utils/parse-progress.ts';

describe('Lesson 1 progress adapter', () => {
  it('repairs corrupt navigation data, preserves completion and drops unknown fields', () => {
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
    });
  });

  it('merges account reach monotonically and keeps the local position', () => {
    const local = parseLessonOneProgress({
      currentStepId: 'air',
      completedStepIds: ['intro', 'string'],
      checkpointPassed: false,
    });
    const merged = mergeLessonOneProgress(local, {
      currentStepId: 'checkpoint',
      completedStepIds: ['intro', 'string', 'air'],
      checkpointPassed: false,
      completedAt: null,
    });

    expect(merged).toEqual({
      currentStepId: 'air',
      completedStepIds: ['intro', 'string', 'air'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(toSyncedLessonOneProgress(merged)).toEqual(merged);
  });

  it('fingerprints only the synced fields in a stable key order', () => {
    const progress = parseLessonOneProgress({ currentStepId: 'string', completedStepIds: ['intro'] });
    const reordered = { completedAt: null, checkpointPassed: false, completedStepIds: ['intro' as const], currentStepId: 'string' as const };
    expect(lessonOneProgressFingerprint(reordered)).toBe(lessonOneProgressFingerprint(progress));
  });

  it('starts a new learner at the intro with no reach', () => {
    expect(lessonOneProgressAdapter.lessonId).toBe('stage-01-lesson-01');
    expect(lessonOneProgressAdapter.defaultProgress).toBe(defaultLessonOneProgress);
    expect(defaultLessonOneProgress).toEqual({ currentStepId: 'intro', completedStepIds: [], checkpointPassed: false, completedAt: null });
  });
});
