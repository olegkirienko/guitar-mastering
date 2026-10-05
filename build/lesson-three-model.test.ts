import { describe, expect, it } from 'vitest';
import { peakGainCap } from '../src/data/lessons/stage-01-lesson-02-model/constants.ts';
import { visualCycles } from '../src/data/lessons/stage-01-lesson-02-model/utils/lab.ts';
import { checkpointTasks, defaultStringSettings, densityLevels, lengthLevels, tensionLevels } from '../src/data/lessons/stage-01-lesson-03-model/constants.ts';
import { checkpointPassed, taskSolved } from '../src/data/lessons/stage-01-lesson-03-model/utils/checkpoint.ts';
import { frequencyChangeText } from '../src/data/lessons/stage-01-lesson-03-model/utils/change.ts';
import { factorLevelIndex, sameSettings, stringFrequency, withFactorLevel } from '../src/data/lessons/stage-01-lesson-03-model/utils/frequency.ts';
import { pluckGain } from '../src/data/lessons/stage-01-lesson-03-model/utils/gain.ts';
import { lessonThreeContent } from '../src/data/lessons/stage-01-lesson-03/constants.ts';

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

  it('tests both model-lab predictions with combinations whose answers match the expected hertz', () => {
    const [shorterTighter, tighterHeavier] = lessonThreeContent.model.predictions;
    expect(stringFrequency(shorterTighter.target)).toBe(880);
    expect(shorterTighter.correctChoiceId).toBe('higher');
    expect(stringFrequency(tighterHeavier.target)).toBe(220);
    expect(tighterHeavier.correctChoiceId).toBe('same');
    expect(sameSettings(tighterHeavier.target, { length: 1, tension: 4, density: 4 })).toBe(true);
    expect(sameSettings(tighterHeavier.target, defaultStringSettings)).toBe(false);
  });

  it('announces the new frequency with its direction', () => {
    const words = { more: 'частіше', less: 'рідше', same: 'так само' };
    expect(frequencyChangeText(220, 880, words)).toBe('880 Гц — частіше');
    expect(frequencyChangeText(440, 220, words)).toBe('220 Гц — рідше');
    expect(frequencyChangeText(220, 220, words)).toBe('220 Гц — так само');
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

describe('Lesson 3 checkpoint', () => {
  const [higher, lower] = checkpointTasks;

  it('starts each task at a state that is not yet solved', () => {
    expect(stringFrequency(higher.start)).toBe(147);
    expect(stringFrequency(lower.start)).toBe(440);
    for (const task of checkpointTasks) expect(taskSolved(task, task.start)).toBe(false);
  });

  it('accepts both free-factor solutions and rejects the wrong direction', () => {
    expect(taskSolved(higher, { ...higher.start, tension: 2.25 })).toBe(true);
    expect(taskSolved(higher, { ...higher.start, density: 1 })).toBe(true);
    expect(taskSolved(higher, { ...higher.start, density: 4 })).toBe(false);
    expect(taskSolved(lower, { ...lower.start, length: 1 })).toBe(true);
    expect(taskSolved(lower, { ...lower.start, density: 2.25 })).toBe(true);
    expect(taskSolved(lower, { ...lower.start, length: 0.5 })).toBe(false);
  });

  it('rejects a solution that moves the locked factor', () => {
    expect(taskSolved(higher, { ...higher.start, length: 0.5 })).toBe(false);
    expect(taskSolved(lower, { ...lower.start, tension: 1 })).toBe(false);
  });

  it('passes only with both tasks solved and every question correct', () => {
    const tasks = checkpointTasks.map((task) => task.id);
    const questions = lessonThreeContent.checkpoint.questions.map((question) => question.id);
    expect(checkpointPassed(tasks, questions, tasks, questions)).toBe(true);
    expect(checkpointPassed(tasks.slice(1), questions, tasks, questions)).toBe(false);
    expect(checkpointPassed(tasks, questions.slice(1), tasks, questions)).toBe(false);
  });

  it('has content for every task', () => {
    expect(lessonThreeContent.checkpoint.tasks.map((task) => task.id)).toEqual(checkpointTasks.map((task) => task.id));
  });
});
