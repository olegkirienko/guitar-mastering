import type { GuitarString } from '@/data/lessons/stage-03-lesson-02-model/types';

// The six open strings, from the thickest (6) to the thinnest (1).
export const openStrings: readonly GuitarString[] = [
  { number: 6, name: '6-та струна', openKey: 4, openNote: 'E', frequency: 82.41 },
  { number: 5, name: '5-та струна', openKey: 9, openNote: 'A', frequency: 110 },
  { number: 4, name: '4-та струна', openKey: 2, openNote: 'D', frequency: 146.83 },
  { number: 3, name: '3-тя струна', openKey: 7, openNote: 'G', frequency: 196 },
  { number: 2, name: '2-га струна', openKey: 11, openNote: 'B', frequency: 246.94 },
  { number: 1, name: '1-ша струна', openKey: 4, openNote: 'E', frequency: 329.63 },
];
