import { describe, expect, it } from 'vitest';
import { fretFrequency } from '../src/data/lessons/stage-03-lesson-01-model/utils/frets.ts';
import { openStrings } from '../src/data/lessons/stage-03-lesson-02-model/constants.ts';
import { fretSteps, fretToNextString, linkedStrings, openStringAfter, stringByNumber, totalSemitones } from '../src/data/lessons/stage-03-lesson-02-model/utils/strings.ts';

describe('Stage III lesson 2 model', () => {
  it('lists the open strings E A D G B E from the 6th to the 1st', () => {
    expect(openStrings.map((item) => item.openNote)).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
    expect(openStrings.map((item) => item.number)).toEqual([6, 5, 4, 3, 2, 1]);
  });

  it('links neighbouring strings by 5, 5, 5, 4, 5 frets', () => {
    expect(linkedStrings.map((number) => fretToNextString(number))).toEqual([5, 5, 5, 4, 5]);
    expect(fretSteps).toEqual([5, 5, 5, 4, 5]);
    expect(fretToNextString(1)).toBeNull();
    expect(openStringAfter(1)).toBeNull();
    expect(openStringAfter(6)?.number).toBe(5);
  });

  it('sums to 24 semitones: the 1st string is two octaves above the 6th', () => {
    expect(totalSemitones()).toBe(24);
    expect(stringByNumber(1).frequency / stringByNumber(6).frequency).toBeCloseTo(4, 1);
  });

  it('presses each string to the next open string, within rounding', () => {
    for (const number of linkedStrings) {
      const from = stringByNumber(number);
      const next = openStringAfter(number);
      expect(Math.round(fretFrequency(from.frequency, fretToNextString(number) ?? 0))).toBe(Math.round(next?.frequency ?? 0));
    }
  });

  it('makes fret 5 on string 3 higher than open string 2', () => {
    expect(fretFrequency(stringByNumber(3).frequency, 5)).toBeGreaterThan(stringByNumber(2).frequency);
  });
});
