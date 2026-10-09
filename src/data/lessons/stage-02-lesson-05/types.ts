import type { OctaveDirection } from '@/data/lessons/stage-02-lesson-01-model/types';

export type LessonTenStepId =
  | 'intro'
  | 'octave'
  | 'count'
  | 'gaps'
  | 'walk'
  | 'guitar'
  | 'complete';

export interface OctaveTask {
  id: string;
  frequency: number;
  direction: OctaveDirection;
}

// Two spelled names; the semitones are counted upward from the first to the second.
export interface CountTask {
  id: string;
  from: string;
  to: string;
  // A short note shown with the answer, when the pair hides a trap.
  trap?: string;
}
