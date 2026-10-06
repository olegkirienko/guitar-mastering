import { describe, expect, it } from 'vitest';
import { defaultLessonFiveProgress, lessonFiveStepOrder } from '../src/progress/lesson-five/constants.ts';
import { lessonFiveProgressAdapter } from '../src/progress/lesson-five/lesson-five.ts';
import { mergeLessonFiveProgress, toSyncedLessonFiveProgress } from '../src/progress/lesson-five/utils/merge-progress.ts';
import { parseLessonFiveProgress } from '../src/progress/lesson-five/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 5 progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-01-lesson-05')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonFiveStepOrder],
    });
    expect(lessonFiveProgressAdapter.lessonId).toBe('stage-01-lesson-05');
    expect(lessonFiveProgressAdapter.defaultProgress).toBe(defaultLessonFiveProgress);
    expect(lessonFiveStepOrder).not.toContain('checkpoint');
  });

  it('unlocks steps linearly and opens completion from the sequence, without a checkpoint step', () => {
    expect(parseLessonFiveProgress({
      currentStepId: 'lower',
      completedStepIds: ['intro', 'higher'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('lower');
    expect(parseLessonFiveProgress({
      currentStepId: 'timbre',
      completedStepIds: ['intro', 'lower'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('higher');
    const beforePath = parseLessonFiveProgress({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'higher', 'lower', 'timbre'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(beforePath.currentStepId).toBe('path');
    const afterPath = parseLessonFiveProgress({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'higher', 'lower', 'timbre', 'path'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(afterPath.currentStepId).toBe('complete');
  });

  it('derives checkpointPassed from the four task steps instead of storing it', () => {
    const solved = parseLessonFiveProgress({
      currentStepId: 'path',
      completedStepIds: ['intro', 'higher', 'lower', 'timbre', 'path'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(solved.checkpointPassed).toBe(true);
    for (const missing of ['higher', 'lower', 'timbre', 'path']) {
      const partial = parseLessonFiveProgress({
        currentStepId: 'intro',
        completedStepIds: ['intro', 'higher', 'lower', 'timbre', 'path'].filter((step) => step !== missing),
        checkpointPassed: true,
        completedAt: null,
      });
      expect(partial.checkpointPassed).toBe(false);
    }
  });

  it('derives completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonFiveProgress({
      currentStepId: 'future-step',
      completedStepIds: ['intro', 'higher', 'lower', 'timbre', 'path', 'future-step'],
      checkpointPassed: false,
      completedAt: '2026-09-30T12:00:00+03:00',
      audioEnabled: true,
    });
    expect(progress).toEqual({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'higher', 'lower', 'timbre', 'path', 'complete'],
      checkpointPassed: true,
      completedAt: '2026-09-30T09:00:00.000Z',
    });
    // Only `complete` is added back: an ID outside this lesson's order would never pass the filter.
    expect(parseLessonFiveProgress({ completedStepIds: ['intro'], completedAt: '2026-09-30T12:00:00Z' }).completedStepIds)
      .toEqual(['intro', 'complete']);
    expect(parseLessonFiveProgress('corrupt')).toEqual(defaultLessonFiveProgress);
    expect(parseLessonFiveProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonFiveProgress, currentStepId: 'lower' as const, completedStepIds: ['intro', 'higher'] as ('intro' | 'higher')[] };
    expect(Object.keys(toSyncedLessonFiveProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonFiveProgress(local, {
      currentStepId: 'higher',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('lower');
    expect(merged.completedStepIds).toEqual(['intro', 'higher']);
  });
});
