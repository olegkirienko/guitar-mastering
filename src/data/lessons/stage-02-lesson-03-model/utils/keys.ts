import { blackKeyPositions, keysInOctave, noteNames, whiteKeyPositions } from '@/data/lessons/stage-02-lesson-03-model/constants';
import type { NoteName } from '@/data/lessons/stage-02-lesson-03-model/types';

export function isWhiteKey(key: number): boolean {
  return Number.isInteger(key) && key >= 0 && whiteKeyPositions.includes(key % keysInOctave);
}

// White keys from `from` to `to`, both included.
export function whiteKeys(from: number, to: number): readonly number[] {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index).filter(isWhiteKey);
}

// Semitones between neighbouring white keys inside one octave, key 0 to key 12.
export function whiteStepSizes(): readonly number[] {
  const keys = whiteKeys(0, keysInOctave);
  return keys.slice(1).map((key, index) => key - keys[index]);
}

// The letter of a white key; `null` for a black key.
export function noteNameOf(key: number): NoteName | null {
  return isWhiteKey(key) ? noteNames[whiteKeyPositions.indexOf(key % keysInOctave)] : null;
}

// The white key of the first octave with this letter.
export function keyOfName(name: NoteName): number {
  return whiteKeyPositions[noteNames.indexOf(name)];
}

// The letter `semitones` above (or below, when negative) the letter; `null` when that key is black.
export function shiftWhite(name: NoteName, semitones: number): NoteName | null {
  const position = (keyOfName(name) + semitones) % keysInOctave;
  return noteNameOf((position + keysInOctave) % keysInOctave);
}

export function isBlackKey(key: number): boolean {
  return Number.isInteger(key) && key >= 0 && blackKeyPositions.includes(key % keysInOctave);
}
