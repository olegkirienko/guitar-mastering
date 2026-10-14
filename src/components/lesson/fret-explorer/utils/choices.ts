import { sharpNames } from '@/data/lessons/stage-03-lesson-01-model/constants';
import type { FretNote } from '@/data/lessons/stage-03-lesson-01-model/types';
import { noteAtFret } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';

// The right note and its neighbours, in the order of the notes so the order gives nothing away.
export function noteOptions(openKey: number, fret: number): readonly FretNote[] {
  const options = new Set([fret, fret + 1, fret - 1, fret + 2].map((candidate) => noteAtFret(openKey, candidate)));
  return sharpNames.filter((name) => options.has(name));
}
