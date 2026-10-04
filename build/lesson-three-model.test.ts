import { describe, expect, it } from 'vitest';
import { peakGainCap } from '../src/data/lessons/stage-01-lesson-02-model/constants.ts';
import { visualCycles } from '../src/data/lessons/stage-01-lesson-02-model/utils/lab.ts';
import { defaultStringSettings, densityLevels, lengthLevels, tensionLevels } from '../src/data/lessons/stage-01-lesson-03-model/constants.ts';
import { factorLevelIndex, stringFrequency, withFactorLevel } from '../src/data/lessons/stage-01-lesson-03-model/utils/frequency.ts';
import { pluckGain } from '../src/data/lessons/stage-01-lesson-03-model/utils/gain.ts';

// expected[length][tension][density], computed independently of the model.
const expected = [
  [[220, 147, 110], [330, 220, 165], [440, 293, 220]],
  [[293, 196, 147], [440, 293, 220], [587, 391, 293]],
  [[440, 293, 220], [660, 440, 330], [880, 587, 440]],
];

const allFrequencies = lengthLevels.flatMap((length) => tensionLevels.flatMap((tension) => densityLevels.map((density) => stringFrequency({ length, tension, density }))));

describe('Lesson 3 string model', () => {
  it('gives the expected whole hertz for every one of the 27 combinations', () => {
    lengthLevels.forEach((length, l) => tensionLevels.forEach((tension, t) => densityLevels.forEach((density, d) => {
      expect(stringFrequency({ length, tension, density })).toBe(expected[l][t][d]);
    })));
    expect(Math.min(...allFrequencies)).toBe(110);
    expect(Math.max(...allFrequencies)).toBe(880);
  });

  it('moves one factor at a time in the discovered directions', () => {
    const singleFactor = (factor: 'length' | 'tension' | 'density') => [0, 1, 2].map((index) => stringFrequency(withFactorLevel(defaultStringSettings, factor, index)));
    expect(singleFactor('length')).toEqual([220, 293, 440]);
    expect(singleFactor('tension')).toEqual([220, 330, 440]);
    expect(singleFactor('density')).toEqual([220, 147, 110]);
    const moved = withFactorLevel(defaultStringSettings, 'tension', 2);
    expect(moved).toEqual({ length: 1, tension: 4, density: 1 });
    expect(factorLevelIndex(moved, 'tension')).toBe(2);
    expect(factorLevelIndex(moved, 'length')).toBe(0);
  });

  it('lets factors cancel each other', () => {
    expect(stringFrequency({ length: 1, tension: 4, density: 4 })).toBe(220);
  });

  it('keeps every reachable pluck at or below Lesson 2 levels and never louder as frequency rises', () => {
    const frequencies = [...new Set(allFrequencies)].sort((a, b) => a - b);
    let previous = Infinity;
    for (const frequency of frequencies) {
      const gain = pluckGain(frequency);
      expect(gain).toBeLessThanOrEqual(peakGainCap);
      expect(gain).toBeLessThanOrEqual(0.1);
      expect(gain).toBeLessThanOrEqual(previous);
      previous = gain;
    }
    expect(pluckGain(220)).toBe(0.1);
    expect(pluckGain(110)).toBe(0.1);
    expect(pluckGain(330)).toBeCloseTo(0.082, 3);
    expect(pluckGain(440)).toBeCloseTo(0.071, 3);
    expect(pluckGain(880)).toBeCloseTo(0.05, 3);
  });

  it('draws 2 to 16 slowed cycles across the reachable range', () => {
    expect(visualCycles(110)).toBe(2);
    expect(visualCycles(880)).toBe(16);
  });
});
