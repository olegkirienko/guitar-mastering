import { walkSteps } from '@/data/lessons/stage-02-lesson-05/constants';
import { offsetFrequency } from '@/components/lesson/offset-key-row/utils/offset';
import { keyOfSpelledName, namesOfKey } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

// A letter and a sign (or none) written as one name: `C` + `♯` is `C♯`.
export function spellName(letter: string, sign: string): string {
  return `${letter}${sign}`;
}

// The key a name points to at `step` semitones from `start`; any spelling of the same key counts, `E♯` included.
export function isNameOfStep(start: number, step: number, name: string): boolean {
  const key = keyOfSpelledName(name);
  return key !== null && key === (start + step) % 12;
}

export function namesOfStep(start: number, step: number): readonly string[] {
  return namesOfKey((start + step) % 12);
}

// Frequencies of the whole walk, start included: 13 sounds.
export function walkFrequencies(start: number): readonly number[] {
  return Array.from({ length: walkSteps + 1 }, (_, step) => offsetFrequency(start, step));
}
