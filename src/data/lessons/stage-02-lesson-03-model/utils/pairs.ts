import { whiteKeys } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { keysInOctave } from '@/data/lessons/stage-02-lesson-03-model/constants';

export interface WhitePair {
  from: number;
  to: number;
  // 1 when no black key lies between, otherwise 2.
  semitones: number;
}

// Neighbouring white keys of the first octave with the number of semitones between them.
export function whitePairs(): readonly WhitePair[] {
  const keys = whiteKeys(0, keysInOctave);
  return keys.slice(1).map((to, index) => ({ from: keys[index], to, semitones: to - keys[index] }));
}

// An answer counts once the learner has picked the right size for the pair.
export function gradePair(pair: WhitePair, semitones: number): boolean {
  return pair.semitones === semitones;
}
