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

export const primaryButton = 'inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';
