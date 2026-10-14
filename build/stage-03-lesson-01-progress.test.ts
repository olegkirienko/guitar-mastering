import { describe, expect, it } from 'vitest';
import { defaultLessonElevenProgress, lessonElevenStepOrder } from '../src/progress/stage-03-lesson-01/constants.ts';
import { lessonElevenProgressAdapter } from '../src/progress/stage-03-lesson-01/stage-03-lesson-01.ts';
import { mergeLessonElevenProgress, toSyncedLessonElevenProgress } from '../src/progress/stage-03-lesson-01/utils/merge-progress.ts';
import { parseLessonElevenProgress } from '../src/progress/stage-03-lesson-01/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 11 (Stage III, 1) progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-03-lesson-01')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonElevenStepOrder],
    });
    expect(lessonElevenProgressAdapter.lessonId).toBe('stage-03-lesson-01');
    expect(lessonElevenProgressAdapter.defaultProgress).toBe(defaultLessonElevenProgress);
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonElevenProgress({
      currentStepId: 'twelve',
      completedStepIds: ['intro', 'press'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('twelve');
    expect(parseLessonElevenProgress({
      currentStepId: 'guitar',
      completedStepIds: ['intro', 'twelve'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('press');
    const tampered = parseLessonElevenProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonElevenStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonElevenProgress({
      currentStepId: 'future-step',
      completedStepIds: ['intro', 'press', 'future-step'],
      checkpointPassed: false,
      completedAt: '2026-09-30T12:00:00+03:00',
      audioEnabled: true,
    });
    expect(progress).toEqual({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'press', 'checkpoint', 'complete'],
      checkpointPassed: true,
      completedAt: '2026-09-30T09:00:00.000Z',
    });
    expect(parseLessonElevenProgress('corrupt')).toEqual(defaultLessonElevenProgress);
    expect(parseLessonElevenProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonElevenProgress, currentStepId: 'twelve' as const, completedStepIds: ['intro', 'press'] as ('intro' | 'press')[] };
    expect(Object.keys(toSyncedLessonElevenProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonElevenProgress(local, {
      currentStepId: 'press',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('twelve');
    expect(merged.completedStepIds).toEqual(['intro', 'press']);
  });
});
