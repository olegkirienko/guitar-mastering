import { semitonesInOctave } from '@/data/lessons/stage-03-lesson-01-model/constants';
import { openStrings } from '@/data/lessons/stage-03-lesson-02-model/constants';
import type { GuitarString } from '@/data/lessons/stage-03-lesson-02-model/types';

export function stringByNumber(number: number): GuitarString {
  const found = openStrings.find((item) => item.number === number);
  if (!found) throw new RangeError(`No string ${number}`);
  return found;
}

// The next string is the one with the number one less (towards the thinnest).
export function openStringAfter(number: number): GuitarString | null {
  return number > 1 ? stringByNumber(number - 1) : null;
}

// The fret of a string where it sounds like the next open string.
export function fretToNextString(number: number): number | null {
  const next = openStringAfter(number);
  if (!next) return null;
  const from = stringByNumber(number);
  return (((next.openKey - from.openKey) % semitonesInOctave) + semitonesInOctave) % semitonesInOctave;
}

// Strings whose link to the next one is a fret on this string: 6, 5, 4, 3, 2.
export const linkedStrings: readonly number[] = openStrings.filter((item) => item.number > 1).map((item) => item.number);

export function totalSemitones(): number {
  return linkedStrings.reduce((sum, number) => sum + (fretToNextString(number) ?? 0), 0);
}

export const fretSteps: readonly number[] = linkedStrings.map((number) => fretToNextString(number) ?? 0);
