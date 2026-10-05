import { describe, expect, it } from 'vitest';
import { defaultLessonFourProgress, lessonFourStepOrder } from '../src/progress/lesson-four/constants.ts';
import { lessonFourProgressAdapter } from '../src/progress/lesson-four/lesson-four.ts';
import { mergeLessonFourProgress, toSyncedLessonFourProgress } from '../src/progress/lesson-four/utils/merge-progress.ts';
import { parseLessonFourProgress } from '../src/progress/lesson-four/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 4 progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-01-lesson-04')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonFourStepOrder],
    });
    expect(lessonFourProgressAdapter.lessonId).toBe('stage-01-lesson-04');
    expect(lessonFourProgressAdapter.defaultProgress).toBe(defaultLessonFourProgress);
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonFourProgress({
      currentStepId: 'spectrum',
      completedStepIds: ['intro', 'shape', 'overtones'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('spectrum');
    expect(parseLessonFourProgress({
      currentStepId: 'envelope',
      completedStepIds: ['intro', 'overtones'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('shape');
    const tampered = parseLessonFourProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonFourStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonFourProgress({
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
    expect(parseLessonFourProgress('corrupt')).toEqual(defaultLessonFourProgress);
    expect(parseLessonFourProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonFourProgress, currentStepId: 'overtones' as const, completedStepIds: ['intro', 'shape'] as ('intro' | 'shape')[] };
    expect(Object.keys(toSyncedLessonFourProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonFourProgress(local, {
      currentStepId: 'shape',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('overtones');
    expect(merged.completedStepIds).toEqual(['intro', 'shape']);
  });
});
