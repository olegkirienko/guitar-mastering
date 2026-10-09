import { flatSign, naturalSign, sharpSign } from '@/data/lessons/stage-02-lesson-04-model/constants';
import { keysInOctave, noteNames } from '@/data/lessons/stage-02-lesson-03-model/constants';
import type { NoteName } from '@/data/lessons/stage-02-lesson-03-model/types';
import { keyOfName, noteNameOf } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';

const spelled = /^([A-G])([♯♭♮]?)$/;

// The key (0..11) a spelled name points to; `E♯` is `F`, `C♭` is `B`. `null` for text that is no name.
export function keyOfSpelledName(name: string): number | null {
  const match = spelled.exec(name);
  if (!match) return null;
  const shift = match[2] === sharpSign ? 1 : match[2] === flatSign ? -1 : 0;
  return (keyOfName(match[1] as NoteName) + shift + keysInOctave) % keysInOctave;
}

// The key a semitone above the letter (0..11); `E` and `B` land on a white key.
export function sharpOf(name: NoteName): number {
  return keyOfSpelledName(`${name}${sharpSign}`) as number;
}

// The key a semitone below the letter (0..11); `F` and `C` land on a white key.
export function flatOf(name: NoteName): number {
  return keyOfSpelledName(`${name}${flatSign}`) as number;
}

// Every name of a key (0..11): one letter for a white key, a sharp and a flat for a black one.
export function namesOfKey(key: number): readonly string[] {
  const position = ((key % keysInOctave) + keysInOctave) % keysInOctave;
  const letter = noteNameOf(position);
  if (letter !== null) return [letter];
  const below = noteNames.find((name) => keyOfName(name) === position - 1) as NoteName;
  const above = noteNames.find((name) => keyOfName(name) === position + 1) as NoteName;
  return [`${below}${sharpSign}`, `${above}${flatSign}`];
}

export function areEnharmonic(first: string, second: string): boolean {
  const a = keyOfSpelledName(first);
  return a !== null && a === keyOfSpelledName(second);
}

// The white key a sign lands on, or `null` when it lands on a black key.
export function whiteLetterOf(name: string): NoteName | null {
  const key = keyOfSpelledName(name);
  return key === null ? null : noteNameOf(key);
}

// How a screen reader should say a name: `C♯` is «C-дієз».
export function spokenName(name: string): string {
  return name.replace(sharpSign, '-дієз').replace(flatSign, '-бемоль').replace(naturalSign, '-бекар');
}
