import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';

export const stopByStep: Record<LessonTwoStepId, number> = {
  intro: 1,
  string: 1,
  repeats: 2,
  frequency: 3,
  loudness: 3,
  guitar: 4,
  checkpoint: 5,
  complete: 5,
};

export const primaryButton = 'inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-primary_on-brand outline-none hover:bg-brand-solid_hover focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2';
