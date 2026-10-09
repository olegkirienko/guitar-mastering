import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { countSemitones, gradeCount } from '../src/components/lesson/count-lab/utils/grading.ts';
import { closePairIndexes, gradePicked, pairNames } from '../src/components/lesson/gaps-lab/utils/grading.ts';
import { gradeOctave, octaveAnswer } from '../src/components/lesson/octave-lab/utils/grading.ts';
import { isNameOfStep, namesOfStep, walkFrequencies } from '../src/components/lesson/semitone-walk-lab/utils/walk.ts';
import { countTasks, octaveTasks, walkSteps } from '../src/data/lessons/stage-02-lesson-05/constants.ts';

const forbidden = /\bлад|гриф|інтервал|гама|тональн|акорд|ключов|подвійн/i;

describe('Lesson 10 content', () => {
  it('uses no terms from later stages', () => {
    const dir = new URL('../src/data/lessons/stage-02-lesson-05/', import.meta.url);
    for (const file of readdirSync(dir)) expect(readFileSync(new URL(file, dir), 'utf8')).not.toMatch(forbidden);
  });

  it('gives every octave task one answer inside the range', () => {
    expect(octaveTasks.map(octaveAnswer)).toEqual([165, 660, 220]);
    expect(gradeOctave(octaveTasks[0], '165')).toBe('right');
    expect(gradeOctave(octaveTasks[0], '660')).toBe('wrong');
    expect(gradeOctave(octaveTasks[1], '660')).toBe('right');
    expect(gradeOctave(octaveTasks[1], '165')).toBe('wrong');
    expect(gradeOctave(octaveTasks[2], '220,5')).toBe('right');
    expect(gradeOctave(octaveTasks[2], '9999')).toBe('range');
    expect(gradeOctave(octaveTasks[2], 'abc')).toBe('empty');
    expect(gradeOctave(octaveTasks[2], '')).toBe('empty');
  });

  it('counts semitones for every pair, with the trap giving 3', () => {
    expect(countTasks.map(countSemitones)).toEqual([5, 4, 3, 3]);
    expect(gradeCount(countTasks[0], '5', '2,5')).toBe('right');
    expect(gradeCount(countTasks[0], '5', '2')).toBe('wrong');
    expect(gradeCount(countTasks[3], '2', '1')).toBe('wrong');
    expect(gradeCount(countTasks[3], '3', '1.5')).toBe('right');
    expect(gradeCount(countTasks[3], '3', '')).toBe('empty');
  });

  it('finds exactly E–F and B–C as the close white pairs', () => {
    expect(closePairIndexes.map((index) => pairNames(index).join('–'))).toEqual(['E–F', 'B–C']);
    expect(gradePicked(closePairIndexes)).toBe(true);
    expect(gradePicked([closePairIndexes[0]])).toBe(false);
    expect(gradePicked([...closePairIndexes, 0])).toBe(false);
  });

  it('walks 12 steps from any white key back to its own name at double the frequency', () => {
    for (const start of [0, 2, 4, 5, 7, 9, 11]) {
      expect(namesOfStep(start, walkSteps)).toEqual(namesOfStep(start, 0));
      const frequencies = walkFrequencies(start);
      expect(frequencies).toHaveLength(walkSteps + 1);
      expect(frequencies[walkSteps] / frequencies[0]).toBeCloseTo(2, 9);
    }
    expect(isNameOfStep(0, 1, 'D♭')).toBe(true);
    expect(isNameOfStep(0, 1, 'C♯')).toBe(true);
    expect(isNameOfStep(0, 1, 'D')).toBe(false);
    expect(isNameOfStep(4, 1, 'E♯')).toBe(true);
    expect(isNameOfStep(11, 1, 'B♯')).toBe(true);
  });
});
