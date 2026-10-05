import type { EnvelopeWords, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

export interface EnvelopeCurveProps {
  sound: TimbreSound;
  label: string;
  words: EnvelopeWords;
}
