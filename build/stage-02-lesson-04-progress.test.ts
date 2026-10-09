import { describe, expect, it } from 'vitest';
import { defaultLessonNineProgress, lessonNineStepOrder } from '../src/progress/stage-02-lesson-04/constants.ts';
import { lessonNineProgressAdapter } from '../src/progress/stage-02-lesson-04/stage-02-lesson-04.ts';
import { mergeLessonNineProgress, toSyncedLessonNineProgress } from '../src/progress/stage-02-lesson-04/utils/merge-progress.ts';
import { parseLessonNineProgress } from '../src/progress/stage-02-lesson-04/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 9 (Stage II, 4) progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-02-lesson-04')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonNineStepOrder],
    });
    expect(lessonNineProgressAdapter.lessonId).toBe('stage-02-lesson-04');
    expect(lessonNineProgressAdapter.defaultProgress).toBe(defaultLessonNineProgress);
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonNineProgress({
      currentStepId: 'same',
      completedStepIds: ['intro', 'raise', 'lower'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('same');
    expect(parseLessonNineProgress({
      currentStepId: 'guitar',
      completedStepIds: ['intro', 'lower'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('raise');
    const tampered = parseLessonNineProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonNineStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonNineProgress({
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
    expect(parseLessonNineProgress('corrupt')).toEqual(defaultLessonNineProgress);
    expect(parseLessonNineProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonNineProgress, currentStepId: 'lower' as const, completedStepIds: ['intro', 'raise'] as ('intro' | 'raise')[] };
    expect(Object.keys(toSyncedLessonNineProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonNineProgress(local, {
      currentStepId: 'raise',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('lower');
    expect(merged.completedStepIds).toEqual(['intro', 'raise']);
  });
});
