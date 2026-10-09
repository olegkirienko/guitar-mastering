import { describe, expect, it } from 'vitest';
import { defaultLessonTenProgress, lessonTenStepOrder } from '../src/progress/stage-02-lesson-05/constants.ts';
import { lessonTenProgressAdapter } from '../src/progress/stage-02-lesson-05/stage-02-lesson-05.ts';
import { mergeLessonTenProgress, toSyncedLessonTenProgress } from '../src/progress/stage-02-lesson-05/utils/merge-progress.ts';
import { parseLessonTenProgress } from '../src/progress/stage-02-lesson-05/utils/parse-progress.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

describe('Lesson 10 (Stage II, 5) progress adapter', () => {
  it('uses the server catalog step order and its own lesson id', () => {
    expect(productionProgressCatalog.get('stage-02-lesson-05')).toEqual({
      schemaVersion: 1,
      contentVersion: 1,
      stepIds: [...lessonTenStepOrder],
    });
    expect(lessonTenProgressAdapter.lessonId).toBe('stage-02-lesson-05');
    expect(lessonTenProgressAdapter.defaultProgress).toBe(defaultLessonTenProgress);
  });

  it('has no checkpoint step', () => {
    expect(lessonTenStepOrder).not.toContain('checkpoint');
  });

  it('unlocks steps linearly, complete included', () => {
    expect(parseLessonTenProgress({
      currentStepId: 'gaps',
      completedStepIds: ['intro', 'octave', 'count'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('gaps');
    expect(parseLessonTenProgress({
      currentStepId: 'walk',
      completedStepIds: ['intro', 'count'],
      checkpointPassed: false,
      completedAt: null,
    }).currentStepId).toBe('octave');
    const opened = parseLessonTenProgress({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'octave', 'count', 'gaps', 'walk', 'guitar'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(opened.currentStepId).toBe('complete');
  });

  it('derives checkpointPassed from the four tasks instead of trusting the stored flag', () => {
    const forged = parseLessonTenProgress({ currentStepId: 'intro', completedStepIds: ['intro', 'octave'], checkpointPassed: true, completedAt: null });
    expect(forged.checkpointPassed).toBe(false);
    const tasksDone = parseLessonTenProgress({ currentStepId: 'guitar', completedStepIds: ['intro', 'octave', 'count', 'gaps', 'walk'], checkpointPassed: false, completedAt: null });
    expect(tasksDone.checkpointPassed).toBe(true);
  });

  it('derives completion from a valid completedAt and drops unknown data', () => {
    const progress = parseLessonTenProgress({
      currentStepId: 'future-step',
      completedStepIds: ['intro', 'checkpoint', 'future-step'],
      checkpointPassed: false,
      completedAt: '2026-09-30T12:00:00+03:00',
      audioEnabled: true,
    });
    expect(progress).toEqual({
      currentStepId: 'complete',
      completedStepIds: ['intro', 'complete'],
      checkpointPassed: true,
      completedAt: '2026-09-30T09:00:00.000Z',
    });
    expect(parseLessonTenProgress('corrupt')).toEqual(defaultLessonTenProgress);
    expect(parseLessonTenProgress({ completedAt: 'not-a-date', currentStepId: 'complete' }).currentStepId).toBe('intro');
  });

  it('syncs only the four server fields and merges monotonically', () => {
    const local = { ...defaultLessonTenProgress, currentStepId: 'count' as const, completedStepIds: ['intro', 'octave'] as ('intro' | 'octave')[] };
    expect(Object.keys(toSyncedLessonTenProgress(local)).sort()).toEqual(['checkpointPassed', 'completedAt', 'completedStepIds', 'currentStepId']);
    const merged = mergeLessonTenProgress(local, {
      currentStepId: 'octave',
      completedStepIds: ['intro'],
      checkpointPassed: false,
      completedAt: null,
    });
    expect(merged.currentStepId).toBe('count');
    expect(merged.completedStepIds).toEqual(['intro', 'octave']);
  });
});
