import type { TimbreSound, WaveWords } from '@/data/lessons/stage-01-lesson-04-model/types';

export interface TimbreWaveProps {
  sound: TimbreSound;
  label: string;
  words: WaveWords;
  // Plain words for the shape, for a screen that has not named the overtones yet.
  shapeNote?: string;
  // Draws each partial as its own thin line under the sum.
  showPartials?: boolean;
}
