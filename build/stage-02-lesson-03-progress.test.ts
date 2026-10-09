import { describe, expect, it } from 'vitest';
import { defaultLessonEightProgress, lessonEightStepOrder } from '../src/progress/stage-02-lesson-03/constants.ts';
import { lessonEightProgressAdapter } from '../src/progress/stage-02-lesson-03/stage-02-lesson-03.ts';
import { mergeLessonEightProgress, toSyncedLessonEightProgress } from '../src/progress/stage-02-lesson-03/utils/merge-progress.ts';
import { parseLessonEightProgress } from '../src/progress/stage-02-lesson-03/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 8 (Stage II, 3) progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-02-lesson-03')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonEightStepOrder],
    });
    expect(lessonEightProgressAdapter.lessonId).toBe('stage-02-lesson-03');
    expect(lessonEightProgressAdapter.defaultProgress).toBe(defaultLessonEightProgress);
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonEightProgress({
      currentStepId: 'names',
      completedStepIds: ['intro', 'look', 'pattern'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('names');
    expect(parseLessonEightProgress({
      currentStepId: 'guitar',
      completedStepIds: ['intro', 'pattern'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('look');
    const tampered = parseLessonEightProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonEightStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonEightProgress({
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
    expect(parseLessonEightProgress('corrupt')).toEqual(defaultLessonEightProgress);
    expect(parseLessonEightProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonEightProgress, currentStepId: 'pattern' as const, completedStepIds: ['intro', 'look'] as ('intro' | 'look')[] };
    expect(Object.keys(toSyncedLessonEightProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonEightProgress(local, {
      currentStepId: 'look',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('pattern');
    expect(merged.completedStepIds).toEqual(['intro', 'look']);
  });
});
