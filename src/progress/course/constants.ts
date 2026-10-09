import { lessonOneContent } from '@/data/lessons/stage-01-lesson-01/constants';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import { lessonFourContent } from '@/data/lessons/stage-01-lesson-04/constants';
import { lessonFiveContent } from '@/data/lessons/stage-01-lesson-05/constants';
import { lessonSixContent } from '@/data/lessons/stage-02-lesson-01/constants';
import { lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';
import { lessonNineContent } from '@/data/lessons/stage-02-lesson-04/constants';
import { lessonEightContent } from '@/data/lessons/stage-02-lesson-03/constants';
import type { CourseLesson } from '@/progress/course/types';
import { lessonFiveProgressAdapter } from '@/progress/lesson-five/lesson-five';
import { lessonFourProgressAdapter } from '@/progress/lesson-four/lesson-four';
import { lessonSixProgressAdapter } from '@/progress/stage-02-lesson-01/stage-02-lesson-01';
import { lessonSevenProgressAdapter } from '@/progress/stage-02-lesson-02/stage-02-lesson-02';
import { lessonEightProgressAdapter } from '@/progress/stage-02-lesson-03/stage-02-lesson-03';
import { lessonNineProgressAdapter } from '@/progress/stage-02-lesson-04/stage-02-lesson-04';
import { lessonOneProgressAdapter } from '@/progress/lesson-one/lesson-one';
import { lessonThreeProgressAdapter } from '@/progress/lesson-three/lesson-three';
import { lessonTwoProgressAdapter } from '@/progress/lesson-two/lesson-two';

// The available lessons in course order; a lesson opens once the one before it is completed.
export const courseLessons: readonly CourseLesson[] = [
  {
    routeId: '01',
    lessonId: lessonOneProgressAdapter.lessonId,
    title: lessonOneContent.title,
    stageLabel: lessonOneContent.stageLabel,
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
    stageLabel: lessonTwoContent.stageLabel,
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
    stageLabel: lessonThreeContent.stageLabel,
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
  {
    routeId: '04',
    lessonId: lessonFourProgressAdapter.lessonId,
    title: lessonFourContent.title,
    stageLabel: lessonFourContent.stageLabel,
    steps: [
      { id: 'intro', title: lessonFourContent.intro.title },
      { id: 'shape', title: lessonFourContent.shape.title },
      { id: 'overtones', title: lessonFourContent.overtones.title },
      { id: 'spectrum', title: lessonFourContent.spectrum.title },
      { id: 'envelope', title: lessonFourContent.envelope.title },
      { id: 'checkpoint', title: lessonFourContent.checkpoint.title },
      { id: 'complete', title: lessonFourContent.complete.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonFourProgressAdapter.parse(value);
      return lessonFourProgressAdapter.stepOrder.filter((step) => lessonFourProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonFourProgressAdapter.parse(value).currentStepId,
  },
  {
    routeId: '05',
    lessonId: lessonFiveProgressAdapter.lessonId,
    title: lessonFiveContent.title,
    stageLabel: lessonFiveContent.stageLabel,
    steps: [
      { id: 'intro', title: lessonFiveContent.intro.title },
      { id: 'higher', title: lessonFiveContent.higher.title },
      { id: 'lower', title: lessonFiveContent.lower.title },
      { id: 'timbre', title: lessonFiveContent.timbre.title },
      { id: 'path', title: lessonFiveContent.path.title },
      { id: 'complete', title: lessonFiveContent.complete.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonFiveProgressAdapter.parse(value);
      return lessonFiveProgressAdapter.stepOrder.filter((step) => lessonFiveProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonFiveProgressAdapter.parse(value).currentStepId,
  },
  {
    routeId: '06',
    lessonId: lessonSixProgressAdapter.lessonId,
    title: lessonSixContent.title,
    stageLabel: lessonSixContent.stageLabel,
    steps: [
      { id: 'intro', title: lessonSixContent.intro.title },
      { id: 'same-name', title: lessonSixContent.sameName.title },
      { id: 'doubler', title: lessonSixContent.doubler.title },
      { id: 'octave', title: lessonSixContent.octave.title },
      { id: 'guitar', title: lessonSixContent.guitar.title },
      { id: 'checkpoint', title: lessonSixContent.checkpoint.title },
      { id: 'complete', title: lessonSixContent.complete.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonSixProgressAdapter.parse(value);
      return lessonSixProgressAdapter.stepOrder.filter((step) => lessonSixProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonSixProgressAdapter.parse(value).currentStepId,
  },
  {
    routeId: '07',
    lessonId: lessonSevenProgressAdapter.lessonId,
    title: lessonSevenContent.title,
    stageLabel: lessonSevenContent.stageLabel,
    steps: [
      { id: 'intro', title: lessonSevenContent.intro.title },
      { id: 'keys', title: lessonSevenContent.keys.title },
      { id: 'steps', title: lessonSevenContent.steps.title },
      { id: 'compare', title: lessonSevenContent.compare.title },
      { id: 'semitone', title: lessonSevenContent.semitone.title },
      { id: 'deeper', title: lessonSevenContent.deeper.title },
      { id: 'guitar', title: lessonSevenContent.guitar.title },
      { id: 'checkpoint', title: lessonSevenContent.checkpoint.title },
      { id: 'complete', title: lessonSevenContent.complete.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonSevenProgressAdapter.parse(value);
      return lessonSevenProgressAdapter.stepOrder.filter((step) => lessonSevenProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonSevenProgressAdapter.parse(value).currentStepId,
  },
  {
    routeId: '08',
    lessonId: lessonEightProgressAdapter.lessonId,
    title: lessonEightContent.title,
    stageLabel: lessonEightContent.stageLabel,
    steps: [
      { id: 'intro', title: lessonEightContent.intro.title },
      { id: 'look', title: lessonEightContent.look.title },
      { id: 'pattern', title: lessonEightContent.pattern.title },
      { id: 'names', title: lessonEightContent.names.title },
      { id: 'anchor', title: lessonEightContent.anchor.title },
      { id: 'guitar', title: lessonEightContent.guitar.title },
      { id: 'checkpoint', title: lessonEightContent.checkpoint.title },
      { id: 'complete', title: lessonEightContent.complete.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonEightProgressAdapter.parse(value);
      return lessonEightProgressAdapter.stepOrder.filter((step) => lessonEightProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonEightProgressAdapter.parse(value).currentStepId,
  },
  {
    routeId: '09',
    lessonId: lessonNineProgressAdapter.lessonId,
    title: lessonNineContent.title,
    stageLabel: lessonNineContent.stageLabel,
    steps: [
      { id: 'intro', title: lessonNineContent.intro.title },
      { id: 'raise', title: lessonNineContent.raise.title },
      { id: 'lower', title: lessonNineContent.lower.title },
      { id: 'same', title: lessonNineContent.same.title },
      { id: 'edges', title: lessonNineContent.edges.title },
      { id: 'guitar', title: lessonNineContent.guitar.title },
      { id: 'checkpoint', title: lessonNineContent.checkpoint.title },
      { id: 'complete', title: lessonNineContent.complete.title },
    ],
    reachableSteps: (value) => {
      const progress = lessonNineProgressAdapter.parse(value);
      return lessonNineProgressAdapter.stepOrder.filter((step) => lessonNineProgressAdapter.isStepReachable(progress, step));
    },
    currentStep: (value) => lessonNineProgressAdapter.parse(value).currentStepId,
  },
];
