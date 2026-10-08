import { baseFrequency, keysInOctave, lastKeyNumber } from '@/data/lessons/stage-02-lesson-02-model/constants';
import type { StepTableRow } from '@/data/lessons/stage-02-lesson-02-model/types';

// Each key is the previous one times the same number: base × 2^(n/12).
export function keyFrequency(base: number, key: number): number {
  return base * 2 ** (key / keysInOctave);
}

// The distance between two keys is the difference of their numbers.
export function semitoneDistance(a: number, b: number): number {
  return Math.abs(b - a);
}

// The key `steps` semitones above, or `null` when it would leave the keyboard.
export function keyAfter(key: number, steps: number): number | null {
  const next = key + steps;
  return Number.isInteger(next) && next >= 0 && next <= lastKeyNumber ? next : null;
}

export function isKeyNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= lastKeyNumber;
}

// Frequencies of all keys with the gap and the ratio to the previous one.
export function stepTable(base: number = baseFrequency): readonly StepTableRow[] {
  return Array.from({ length: lastKeyNumber + 1 }, (_, key) => {
    const frequency = keyFrequency(base, key);
    const previous = key === 0 ? null : keyFrequency(base, key - 1);
    return {
      key,
      frequency,
      difference: previous === null ? null : frequency - previous,
      ratio: previous === null ? null : frequency / previous,
    };
  });
}
