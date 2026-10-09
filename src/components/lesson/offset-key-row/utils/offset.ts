import { baseFrequency, lastKeyNumber } from '@/data/lessons/stage-02-lesson-03-model/constants';
import { isWhiteKey } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';

// The row always has 13 keys: the first stands for `start`, the last for the same name an octave up.
export const offsetKeyCount = lastKeyNumber + 1;

export function offsetBase(start: number): number {
  return keyFrequency(baseFrequency, start);
}

export function offsetFrequency(start: number, key: number): number {
  return keyFrequency(offsetBase(start), key);
}

// Places in the row where the key is black.
export function offsetNarrowKeys(start: number): readonly number[] {
  return Array.from({ length: offsetKeyCount }, (_, key) => key).filter((key) => !isWhiteKey((start + key) % 12));
}
