import { describe, expect, it } from 'vitest';
import { isLessonOpen } from '../src/hooks/use-lesson-route/utils/lesson-gate.ts';
import { safeNextPath, isSafeNext } from '../src/pages/auth-page/utils/is-safe-next.ts';
import { courseLessons } from '../src/progress/course/constants.ts';
import type { ProgressItem, ProgressValue } from '../src/progress/core/types.ts';
import { resolveResumePath } from '../src/progress/core/utils/resolve-resume-path.ts';
import { lessonOneProgressAdapter } from '../src/progress/lesson-one/lesson-one.ts';
import { lessonThreeProgressAdapter } from '../src/progress/lesson-three/lesson-three.ts';
import { lessonTwoProgressAdapter } from '../src/progress/lesson-two/lesson-two.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';

const origin = 'https://course.example';
const one = 'stage-01-lesson-01';
const two = 'stage-01-lesson-02';
const three = 'stage-01-lesson-03';

function item(lessonId: string, progress: Partial<ProgressValue>, updatedAt: string): ProgressItem {
  return {
    lessonId,
    schemaVersion: 1,
    contentVersion: 1,
    revision: 1,
    updatedAt,
    progress: { currentStepId: 'intro', completedStepIds: [], checkpointPassed: false, completedAt: null, ...progress },
  };
}

describe('resolveResumePath', () => {
  it('starts Lesson 1 without any progress', () => {
    expect(resolveResumePath([], courseLessons)).toBe('/lessons/01/intro');
  });

  it('resumes the unfinished lesson even when a finished one was opened later', () => {
    const items = [
      item(one, { currentStepId: 'air', completedAt: '2026-10-01T10:00:00.000Z' }, '2026-10-04T12:00:00.000Z'),
      item(two, { currentStepId: 'frequency' }, '2026-10-03T12:00:00.000Z'),
    ];
    expect(resolveResumePath(items, courseLessons)).toBe('/lessons/02/frequency');
  });

  it('opens the next lesson once the previous one is completed and the next is not started', () => {
    const items = [item(one, { currentStepId: 'complete', completedAt: '2026-10-01T10:00:00.000Z' }, '2026-10-01T10:00:00.000Z')];
    expect(resolveResumePath(items, courseLessons)).toBe('/lessons/02/intro');
  });

  it('returns the most recently opened lesson when everything is completed', () => {
    const items = [
      item(one, { currentStepId: 'string', completedAt: '2026-10-01T10:00:00.000Z' }, '2026-10-04T12:00:00.000Z'),
      item(two, { currentStepId: 'complete', completedAt: '2026-10-02T10:00:00.000Z' }, '2026-10-03T12:00:00.000Z'),
      item(three, { currentStepId: 'complete', completedAt: '2026-10-03T10:00:00.000Z' }, '2026-10-03T10:00:00.000Z'),
    ];
    expect(resolveResumePath(items, courseLessons)).toBe('/lessons/01/string');
  });

  it('opens Lesson 3 once Lessons 1 and 2 are completed', () => {
    const items = [
      item(one, { currentStepId: 'complete', completedAt: '2026-10-01T10:00:00.000Z' }, '2026-10-01T10:00:00.000Z'),
      item(two, { currentStepId: 'complete', completedAt: '2026-10-02T10:00:00.000Z' }, '2026-10-02T10:00:00.000Z'),
    ];
    expect(resolveResumePath(items, courseLessons)).toBe('/lessons/03/intro');
  });

  it('ignores progress of lessons outside the course order', () => {
    expect(resolveResumePath([item('unknown', { currentStepId: 'x' }, '2026-10-04T12:00:00.000Z')], courseLessons)).toBe('/lessons/01/intro');
  });
});

describe('isSafeNext', () => {
  it.each([
    ['//x', null],
    ['/\\x', null],
    ['/%2f%2fx', null],
    ['/%2F%5Cx', null],
    ['https://x', null],
    ['javascript:alert(1)', null],
    ['/auth', null],
    ['/', null],
    ['/lessons/99/x', null],
    ['/lessons/01/unknown', null],
    ['/lessons/01/air\n', null],
    ['/lessons/01/air?x#y', '/lessons/01/air'],
    ['/lessons/02', '/lessons/02'],
    ['/course', '/course'],
    ['/account', '/account'],
  ])('%j → %j', (next, expected) => {
    expect(safeNextPath(next, origin)).toBe(expected);
    expect(isSafeNext(next, origin)).toBe(expected !== null);
  });

  it('ignores a missing next', () => {
    expect(safeNextPath(null, origin)).toBeNull();
  });
});

describe('isStepReachable', () => {
  it('opens Lesson 1 steps one after another and completion only after the checkpoint', () => {
    const progress = lessonOneProgressAdapter.parse({ currentStepId: 'string', completedStepIds: ['intro', 'string'] });
    expect(lessonOneProgressAdapter.stepOrder.filter((step) => lessonOneProgressAdapter.isStepReachable(progress, step))).toEqual(['intro', 'string', 'air']);
    expect(lessonOneProgressAdapter.isStepReachable(progress, 'nope')).toBe(false);
    expect(lessonOneProgressAdapter.highestReachableStep(progress)).toBe('air');
    const passed = lessonOneProgressAdapter.parse({ completedStepIds: ['intro', 'string', 'air', 'checkpoint'], checkpointPassed: true });
    expect(lessonOneProgressAdapter.isStepReachable(passed, 'complete')).toBe(true);
    expect(lessonOneProgressAdapter.isStepReachable({ ...passed, checkpointPassed: false, completedStepIds: ['intro', 'string', 'air'] }, 'complete')).toBe(false);
  });

  it('opens Lesson 2 steps linearly', () => {
    const progress = lessonTwoProgressAdapter.parse({ completedStepIds: ['intro', 'string', 'repeats'] });
    expect(lessonTwoProgressAdapter.stepOrder.filter((step) => lessonTwoProgressAdapter.isStepReachable(progress, step))).toEqual(['intro', 'string', 'repeats', 'frequency']);
    expect(lessonTwoProgressAdapter.highestReachableStep(progress)).toBe('frequency');
    expect(lessonTwoProgressAdapter.isStepReachable(progress, 'complete')).toBe(false);
  });

  it('opens Lesson 3 steps linearly', () => {
    const progress = lessonThreeProgressAdapter.parse({ completedStepIds: ['intro', 'length'] });
    expect(lessonThreeProgressAdapter.stepOrder.filter((step) => lessonThreeProgressAdapter.isStepReachable(progress, step))).toEqual(['intro', 'length', 'tension']);
    expect(lessonThreeProgressAdapter.highestReachableStep(progress)).toBe('tension');
    expect(lessonThreeProgressAdapter.isStepReachable(progress, 'complete')).toBe(false);
  });
});

describe('lesson gate', () => {
  const lessonOneDone = item(one, { currentStepId: 'complete', completedAt: '2026-10-01T10:00:00.000Z' }, '2026-10-01T10:00:00.000Z');

  it('keeps /lessons/03/* closed (redirect to /course) until Lesson 2 has completedAt', () => {
    expect(isLessonOpen('03', [])).toBe(false);
    expect(isLessonOpen('03', [lessonOneDone])).toBe(false);
    expect(isLessonOpen('03', [lessonOneDone, item(two, { currentStepId: 'checkpoint', checkpointPassed: true }, '2026-10-02T10:00:00.000Z')])).toBe(false);
    expect(isLessonOpen('03', [lessonOneDone, item(two, { currentStepId: 'complete', completedAt: '2026-10-02T10:00:00.000Z' }, '2026-10-02T10:00:00.000Z')])).toBe(true);
  });

  it('opens the first lesson without progress and each next one after its predecessor', () => {
    expect(isLessonOpen('01', [])).toBe(true);
    expect(isLessonOpen('02', [])).toBe(false);
    expect(isLessonOpen('02', [lessonOneDone])).toBe(true);
    expect(isLessonOpen('03', [item(three, {}, '2026-10-02T10:00:00.000Z')])).toBe(false);
  });
});

describe('course catalog', () => {
  it('lists every lesson step in the server catalog order', () => {
    for (const lesson of courseLessons) {
      expect(lesson.steps.map((step) => step.id)).toEqual(productionProgressCatalog.get(lesson.lessonId)?.stepIds);
    }
  });
});
