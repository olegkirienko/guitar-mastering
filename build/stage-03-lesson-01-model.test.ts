import { describe, expect, it } from 'vitest';
import { fifthString } from '../src/data/lessons/stage-03-lesson-01-model/constants.ts';
import { fretFrequency, fretLengthFraction, fretPosition, fretsForNote, isFretNumber, noteAtFret } from '../src/data/lessons/stage-03-lesson-01-model/utils/frets.ts';

describe('Stage III lesson 1 model', () => {
  it('doubles the frequency at fret 12', () => {
    expect(fretFrequency(110, 12)).toBeCloseTo(220, 9);
    expect(fretFrequency(110, 0)).toBe(110);
    expect([1, 2, 3].map((fret) => Math.round(fretFrequency(110, fret)))).toEqual([117, 123, 131]);
  });

  it('halves the sounding length at fret 12', () => {
    expect(fretLengthFraction(0)).toBe(1);
    expect(fretLengthFraction(12)).toBeCloseTo(0.5, 9);
    expect(fretPosition(12)).toBeCloseTo(0.5, 9);
  });

  it('names the notes of the A string', () => {
    const { openKey } = fifthString;
    expect([0, 1, 3, 5, 7, 12].map((fret) => noteAtFret(openKey, fret))).toEqual(['A', 'A♯', 'C', 'D', 'E', 'A']);
  });

  it('finds frets for a note, with the open string and fret 12 both holding A', () => {
    expect(fretsForNote(fifthString.openKey, 'D')).toEqual([5]);
    expect(fretsForNote(fifthString.openKey, 'A')).toEqual([0, 12]);
  });

  it('accepts only whole frets 0..12', () => {
    expect([0, 12, 7].every(isFretNumber)).toBe(true);
    expect([-1, 13, 1.5, Number.NaN].some(isFretNumber)).toBe(false);
  });
});
