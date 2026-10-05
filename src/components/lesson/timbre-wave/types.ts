import type { TimbreSound, WaveWords } from '@/data/lessons/stage-01-lesson-04-model/types';

export interface TimbreWaveProps {
  sound: TimbreSound;
  label: string;
  words: WaveWords;
  // Draws each partial as its own thin line under the sum.
  showPartials?: boolean;
}
