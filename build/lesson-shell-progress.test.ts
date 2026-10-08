import { describe, expect, it } from 'vitest';
import { deriveStepProgress } from '../src/components/lesson/lesson-shell/utils/step-progress.ts';
import { lessonOneContent } from '../src/data/lessons/stage-01-lesson-01/constants.ts';
import { lessonTwoContent } from '../src/data/lessons/stage-01-lesson-02/constants.ts';
import { lessonThreeContent } from '../src/data/lessons/stage-01-lesson-03/constants.ts';
import { lessonFourContent } from '../src/data/lessons/stage-01-lesson-04/constants.ts';
import { lessonSixContent } from '../src/data/lessons/stage-02-lesson-01/constants.ts';
import { lessonSevenContent } from '../src/data/lessons/stage-02-lesson-02/constants.ts';
import { lessonFiveContent } from '../src/data/lessons/stage-01-lesson-05/constants.ts';
import { courseLessons } from '../src/progress/course/constants.ts';

const steps = [
  { id: 'intro', title: 'Питання' },
  { id: 'string', title: 'Струна' },
  { id: 'air', title: 'Повітря' },
];
const labels = { intro: 'Питання', string: 'Струна', air: 'Повітря' };

const contentByRoute = {
  '01': lessonOneContent,
  '02': lessonTwoContent,
  '03': lessonThreeContent,
  '04': lessonFourContent,
  '05': lessonFiveContent,
  '06': lessonSixContent,
  '07': lessonSevenContent,
};

describe('deriveStepProgress', () => {
  it('numbers the step from its place in the step list', () => {
    expect(deriveStepProgress(steps, 'string', labels)).toEqual({ index: 1, total: 3, caption: 'Струна' });
    expect(deriveStepProgress(steps, 'air', labels)).toEqual({ index: 2, total: 3, caption: 'Повітря' });
  });

  it('clamps an unknown step id to the first step instead of reporting 0 із N', () => {
    expect(deriveStepProgress(steps, 'missing', labels)).toEqual({ index: 0, total: 3, caption: 'Питання' });
  });

  it('falls back to the step title when the label key is missing', () => {
    expect(deriveStepProgress(steps, 'air', { intro: 'Питання' }).caption).toBe('Повітря');
  });
});

describe('lesson step labels', () => {
  it.each(courseLessons.map((lesson) => [lesson.routeId, lesson] as const))('lesson %s labels every step id', (routeId, lesson) => {
    const { stepLabels } = contentByRoute[routeId as keyof typeof contentByRoute];
    expect(Object.keys(stepLabels).sort()).toEqual(lesson.steps.map((step) => step.id).sort());
  });

  it.each(courseLessons.map((lesson) => [lesson.routeId, lesson] as const))('lesson %s numbers every step from the list', (routeId, lesson) => {
    const { stepLabels } = contentByRoute[routeId as keyof typeof contentByRoute];
    const numbers = lesson.steps.map((step) => deriveStepProgress(lesson.steps, step.id, stepLabels).index + 1);
    expect(numbers).toEqual(lesson.steps.map((_, position) => position + 1));
  });
});
