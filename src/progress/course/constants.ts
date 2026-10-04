import { lessonOneContent } from '@/data/lessons/stage-01-lesson-01/constants';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import type { CourseLesson } from '@/progress/course/types';
import { lessonOneProgressAdapter } from '@/progress/lesson-one/lesson-one';
import { lessonThreeProgressAdapter } from '@/progress/lesson-three/lesson-three';
import { lessonTwoProgressAdapter } from '@/progress/lesson-two/lesson-two';

// The available lessons in course order; a lesson opens once the one before it is completed.
export const courseLessons: readonly CourseLesson[] = [
  {
    routeId: '01',
    lessonId: lessonOneProgressAdapter.lessonId,
    title: lessonOneContent.title,
    steps: [
      { id: 'intro', title: lessonOneContent.intro.title },
      { id: 'string', title: lessonOneContent.string.title },
      { id: 'air', title: lessonOneContent.air.title },
      { id: 'checkpoint', title: lessonOneContent.checkpoint.title },
      { id: 'complete', title: lessonOneContent.completion.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonOneProgressAdapter.parse(value);
      return lessonOneProgressAdapter.stepOrder.filter((step) => lessonOneProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonOneProgressAdapter.parse(value).currentStepId,
  },
  {
    routeId: '02',
    lessonId: lessonTwoProgressAdapter.lessonId,
    title: lessonTwoContent.title,
    steps: [
      { id: 'intro', title: lessonTwoContent.intro.title },
      { id: 'string', title: lessonTwoContent.string.title },
      { id: 'repeats', title: lessonTwoContent.repeats.title },
      { id: 'frequency', title: lessonTwoContent.frequency.title },
      { id: 'loudness', title: lessonTwoContent.loudness.title },
      { id: 'guitar', title: lessonTwoContent.guitar.title },
      { id: 'checkpoint', title: lessonTwoContent.checkpoint.title },
      { id: 'complete', title: lessonTwoContent.complete.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonTwoProgressAdapter.parse(value);
      return lessonTwoProgressAdapter.stepOrder.filter((step) => lessonTwoProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonTwoProgressAdapter.parse(value).currentStepId,
  },
  {
    routeId: '03',
    lessonId: lessonThreeProgressAdapter.lessonId,
    title: lessonThreeContent.title,
    steps: [
      { id: 'intro', title: lessonThreeContent.intro.title },
      { id: 'length', title: lessonThreeContent.length.title },
      { id: 'tension', title: lessonThreeContent.tension.title },
      { id: 'density', title: lessonThreeContent.density.title },
      { id: 'model', title: lessonThreeContent.model.title },
      { id: 'checkpoint', title: lessonThreeContent.checkpoint.title },
      { id: 'complete', title: lessonThreeContent.complete.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonThreeProgressAdapter.parse(value);
      return lessonThreeProgressAdapter.stepOrder.filter((step) => lessonThreeProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonThreeProgressAdapter.parse(value).currentStepId,
  },
];
