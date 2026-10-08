import { describe, expect, it } from 'vitest';
import { defaultLessonSevenProgress, lessonSevenStepOrder } from '../src/progress/stage-02-lesson-02/constants.ts';
import { lessonSevenProgressAdapter } from '../src/progress/stage-02-lesson-02/stage-02-lesson-02.ts';
import { mergeLessonSevenProgress, toSyncedLessonSevenProgress } from '../src/progress/stage-02-lesson-02/utils/merge-progress.ts';
import { parseLessonSevenProgress } from '../src/progress/stage-02-lesson-02/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 7 (Stage II, 2) progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-02-lesson-02')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonSevenStepOrder],
    });
    expect(lessonSevenProgressAdapter.lessonId).toBe('stage-02-lesson-02');
    expect(lessonSevenProgressAdapter.defaultProgress).toBe(defaultLessonSevenProgress);
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonSevenProgress({
      currentStepId: 'semitone',
      completedStepIds: ['intro', 'keys', 'steps', 'compare'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('semitone');
    expect(parseLessonSevenProgress({
      currentStepId: 'guitar',
      completedStepIds: ['intro', 'steps'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('keys');
    const tampered = parseLessonSevenProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonSevenStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonSevenProgress({
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
    expect(parseLessonSevenProgress('corrupt')).toEqual(defaultLessonSevenProgress);
    expect(parseLessonSevenProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonSevenProgress, currentStepId: 'steps' as const, completedStepIds: ['intro', 'keys'] as ('intro' | 'keys')[] };
    expect(Object.keys(toSyncedLessonSevenProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonSevenProgress(local, {
      currentStepId: 'keys',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('steps');
    expect(merged.completedStepIds).toEqual(['intro', 'keys']);
  });

  it('opens guitar and the checkpoint after deeper whichever way it was left', () => {
    const upToCompare = ['intro', 'keys', 'steps', 'compare', 'semitone'] as const;
    const withDeeper = parseLessonSevenProgress({ currentStepId: 'checkpoint', completedStepIds: [...upToCompare, 'deeper', 'guitar'], checkpointPassed: false, completedAt: null });
    expect(withDeeper.currentStepId).toBe('checkpoint');
    // A learner who skipped deeper without completing it stays on it.
    const skipped = parseLessonSevenProgress({ currentStepId: 'guitar', completedStepIds: [...upToCompare], checkpointPassed: false, completedAt: null });
    expect(skipped.currentStepId).toBe('deeper');
    expect(lessonSevenProgressAdapter.isStepReachable(withDeeper, 'guitar')).toBe(true);
  });
});
