import { lastFret, semitonesInOctave, sharpNames } from '@/data/lessons/stage-03-lesson-01-model/constants';
import type { FretNote } from '@/data/lessons/stage-03-lesson-01-model/types';

export function isFretNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= lastFret;
}

// Every fret raises the sound by one semitone.
export function fretSemitones(fret: number): number {
  return fret;
}

// Each semitone multiplies the frequency by the same number.
export function fretFrequency(open: number, fret: number): number {
  return open * 2 ** (fretSemitones(fret) / semitonesInOctave);
}

// The part of the string that still sounds when it is pressed at the fret.
export function fretLengthFraction(fret: number): number {
  return 2 ** (-fret / semitonesInOctave);
}

// Where the fret sits, as a share of the whole string counted from the nut.
export function fretPosition(fret: number): number {
  return 1 - fretLengthFraction(fret);
}

export function noteAtFret(openKey: number, fret: number): FretNote {
  return sharpNames[(((openKey + fretSemitones(fret)) % semitonesInOctave) + semitonesInOctave) % semitonesInOctave];
}

// Open string and the 12th fret share a note, so a note can sit on two frets.
export function fretsForNote(openKey: number, note: FretNote): readonly number[] {
  return Array.from({ length: lastFret + 1 }, (_, fret) => fret).filter((fret) => noteAtFret(openKey, fret) === note);
}

export const hertz = (frequency: number): string => `${Math.round(frequency)} Гц`;

// Frets whose note carries a sharp: drawn as dark keys in the key row.
export function sharpFrets(openKey: number, count: number): readonly number[] {
  return Array.from({ length: count }, (_, fret) => fret).filter((fret) => noteAtFret(openKey, fret).includes('♯'));
}
