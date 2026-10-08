import { describe, expect, it } from 'vitest';
import { defaultLessonSixProgress, lessonSixStepOrder } from '../src/progress/stage-02-lesson-01/constants.ts';
import { lessonSixProgressAdapter } from '../src/progress/stage-02-lesson-01/stage-02-lesson-01.ts';
import { mergeLessonSixProgress, toSyncedLessonSixProgress } from '../src/progress/stage-02-lesson-01/utils/merge-progress.ts';
import { parseLessonSixProgress } from '../src/progress/stage-02-lesson-01/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 6 (Stage II, 1) progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-02-lesson-01')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonSixStepOrder],
    });
    expect(lessonSixProgressAdapter.lessonId).toBe('stage-02-lesson-01');
    expect(lessonSixProgressAdapter.defaultProgress).toBe(defaultLessonSixProgress);
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonSixProgress({
      currentStepId: 'octave',
      completedStepIds: ['intro', 'same-name', 'doubler'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('octave');
    expect(parseLessonSixProgress({
      currentStepId: 'guitar',
      completedStepIds: ['intro', 'doubler'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('same-name');
    const tampered = parseLessonSixProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonSixStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonSixProgress({
      currentStepId: 'future-step',
      completedStepIds: ['intro', 'length', 'future-step'],
      checkpointPassed: false,
      completedAt: '2026-09-30T12:00:00+03:00',
      audioEnabled: true,
    });
    expect(progress).toEqual({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'checkpoint', 'complete'],
      checkpointPassed: true,
      completedAt: '2026-09-30T09:00:00.000Z',
    });
    expect(parseLessonSixProgress('corrupt')).toEqual(defaultLessonSixProgress);
    expect(parseLessonSixProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonSixProgress, currentStepId: 'doubler' as const, completedStepIds: ['intro', 'same-name'] as ('intro' | 'same-name')[] };
    expect(Object.keys(toSyncedLessonSixProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonSixProgress(local, {
      currentStepId: 'same-name',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('doubler');
    expect(merged.completedStepIds).toEqual(['intro', 'same-name']);
  });
});
