import { isKeyNumber, keyAfter, semitoneDistance } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';

export type CheckpointVerdict = 'right' | 'wrong' | 'range' | 'empty';

// A typed number with a comma or a dot; `null` for an empty or unreadable field.
export function parseNumber(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (text === '') return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

// Whole numbers are rounded; an empty field is not checked.
export function parseWhole(input: string): number | null {
  const value = parseNumber(input);
  return value === null ? null : Math.round(value);
}

// Task 1: both the semitones and the tones between two keys.
export function gradeDistance(from: number, to: number, semitonesInput: string, tonesInput: string): CheckpointVerdict {
  const semitones = parseWhole(semitonesInput);
  const tones = parseNumber(tonesInput);
  if (semitones === null || tones === null) return 'empty';
  const distance = semitoneDistance(from, to);
  return semitones === distance && Math.abs(tones - distance / 2) < 1e-9 ? 'right' : 'wrong';
}

// Task 2: the key `steps` semitones above `from`; a number off the keyboard is not a mistake.
export function gradeKeyAfter(from: number, steps: number, input: string): CheckpointVerdict {
  const answer = parseWhole(input);
  if (answer === null) return 'empty';
  if (!isKeyNumber(answer)) return 'range';
  return answer === keyAfter(from, steps) ? 'right' : 'wrong';
}

// Task 3: the number of semitones in the octave; the field takes 0–12.
export function gradeReturn(input: string, expected: number): CheckpointVerdict {
  const answer = parseWhole(input);
  if (answer === null) return 'empty';
  if (!isKeyNumber(answer)) return 'range';
  return answer === expected ? 'right' : 'wrong';
}
