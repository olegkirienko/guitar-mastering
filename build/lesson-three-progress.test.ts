import { describe, expect, it } from 'vitest';
import { defaultLessonThreeProgress, lessonThreeStepOrder } from '../src/progress/lesson-three/constants.ts';
import { lessonThreeProgressAdapter } from '../src/progress/lesson-three/lesson-three.ts';
import { mergeLessonThreeProgress, toSyncedLessonThreeProgress } from '../src/progress/lesson-three/utils/merge-progress.ts';
import { parseLessonThreeProgress } from '../src/progress/lesson-three/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 3 progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-01-lesson-03')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonThreeStepOrder],
    });
    expect(lessonThreeProgressAdapter.lessonId).toBe('stage-01-lesson-03');
    expect(lessonThreeProgressAdapter.defaultProgress).toBe(defaultLessonThreeProgress);
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonThreeProgress({
      currentStepId: 'density',
      completedStepIds: ['intro', 'length', 'tension'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('density');
    expect(parseLessonThreeProgress({
      currentStepId: 'model',
      completedStepIds: ['intro', 'tension'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('length');
    const tampered = parseLessonThreeProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonThreeStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonThreeProgress({
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
    expect(parseLessonThreeProgress('corrupt')).toEqual(defaultLessonThreeProgress);
    expect(parseLessonThreeProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonThreeProgress, currentStepId: 'tension' as const, completedStepIds: ['intro', 'length'] as ('intro' | 'length')[] };
    expect(Object.keys(toSyncedLessonThreeProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonThreeProgress(local, {
      currentStepId: 'length',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('tension');
    expect(merged.completedStepIds).toEqual(['intro', 'length']);
  });
});
