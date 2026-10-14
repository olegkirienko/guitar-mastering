import { describe, expect, it } from 'vitest';
import { defaultLessonTwelveProgress, lessonTwelveStepOrder } from '../src/progress/stage-03-lesson-02/constants.ts';
import { lessonTwelveProgressAdapter } from '../src/progress/stage-03-lesson-02/stage-03-lesson-02.ts';
import { mergeLessonTwelveProgress, toSyncedLessonTwelveProgress } from '../src/progress/stage-03-lesson-02/utils/merge-progress.ts';
import { parseLessonTwelveProgress } from '../src/progress/stage-03-lesson-02/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 12 (Stage III, 2) progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-03-lesson-02')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonTwelveStepOrder],
    });
    expect(lessonTwelveProgressAdapter.lessonId).toBe('stage-03-lesson-02');
    expect(lessonTwelveProgressAdapter.defaultProgress).toBe(defaultLessonTwelveProgress);
  });

  it('unlocks steps linearly and never lets a completed checkpoint unlock completion by itself', () => {
    expect(parseLessonTwelveProgress({
      currentStepId: 'link',
      completedStepIds: ['intro', 'strings'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('link');
    expect(parseLessonTwelveProgress({
      currentStepId: 'guitar',
      completedStepIds: ['intro', 'link'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('strings');
    const tampered = parseLessonTwelveProgress({
      currentStepId: 'complete',
      completedStepIds: [...lessonTwelveStepOrder],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(tampered.currentStepId).toBe('checkpoint');
    expect(tampered.checkpointPassed).toBe(false);
  });

  it('derives the checkpoint and completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonTwelveProgress({
      currentStepId: 'future-step',
      completedStepIds: ['intro', 'strings', 'future-step'],
      checkpointPassed: false,
      completedAt: '2026-09-30T12:00:00+03:00',
      audioEnabled: true,
    });
    expect(progress).toEqual({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'strings', 'checkpoint', 'complete'],
      checkpointPassed: true,
      completedAt: '2026-09-30T09:00:00.000Z',
    });
    expect(parseLessonTwelveProgress('corrupt')).toEqual(defaultLessonTwelveProgress);
    expect(parseLessonTwelveProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonTwelveProgress, currentStepId: 'link' as const, completedStepIds: ['intro', 'strings'] as ('intro' | 'strings')[] };
    expect(Object.keys(toSyncedLessonTwelveProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonTwelveProgress(local, {
      currentStepId: 'strings',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('link');
    expect(merged.completedStepIds).toEqual(['intro', 'strings']);
  });
});
