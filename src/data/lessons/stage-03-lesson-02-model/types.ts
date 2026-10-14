import type { OpenString } from '@/data/lessons/stage-03-lesson-01-model/types';

export interface GuitarString extends OpenString {
  // 1 is the thinnest and highest string, 6 the thickest and lowest.
  number: number;
}
