import { describe, expect, it } from 'vitest';
import { defaultLessonTwoProgress, lessonTwoStepOrder } from '../src/progress/lesson-two/constants.ts';
import { lessonTwoProgressAdapter } from '../src/progress/lesson-two/lesson-two.ts';
import { mergeLessonTwoProgress, toSyncedLessonTwoProgress } from '../src/progress/lesson-two/utils/merge-progress.ts';
import { parseLessonTwoProgress } from '../src/progress/lesson-two/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 2 progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-01-lesson-02')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonTwoStepOrder],
    });
    expect(lessonTwoProgressAdapter.lessonId).toBe('stage-01-lesson-02');
    expect(lessonTwoProgressAdapter.defaultProgress).toBe(defaultLessonTwoProgress);
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
    });
    expect(parseLessonTwoProgress('corrupt')).toEqual(defaultLessonTwoProgress);
    expect(parseLessonTwoProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonTwoProgress, currentStepId: 'repeats' as const, completedStepIds: ['intro', 'string'] as ('intro' | 'string')[] };
    expect(Object.keys(toSyncedLessonTwoProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonTwoProgress(local, {
      currentStepId: 'string',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('repeats');
    expect(merged.completedStepIds).toEqual(['intro', 'string']);
  });
});
