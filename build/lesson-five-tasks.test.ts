import { describe, expect, it } from 'vitest';
import { densityLevels, factorOrder, lengthLevels, tensionLevels } from '../src/data/lessons/stage-01-lesson-03-model/constants.ts';
import type { StringFactor, StringSettings } from '../src/data/lessons/stage-01-lesson-03-model/types.ts';
import { taskSolved } from '../src/data/lessons/stage-01-lesson-03-model/utils/checkpoint.ts';
import { stringFrequency } from '../src/data/lessons/stage-01-lesson-03-model/utils/frequency.ts';
import { lessonFiveContent } from '../src/data/lessons/stage-01-lesson-05/constants.ts';

const { higher, lower } = lessonFiveContent;
const tasks = [higher.task, lower.task];
const levelsOf: Record<StringFactor, readonly number[]> = { length: lengthLevels, tension: tensionLevels, density: densityLevels };

// Every state reachable from a start by moving one free factor to another of its levels.
function singleMoves(start: StringSettings, locked: StringFactor): { factor: StringFactor; settings: StringSettings }[] {
  return factorOrder
    .filter((factor) => factor !== locked)
    .flatMap((factor) => levelsOf[factor]
      .filter((level) => level !== start[factor])
      .map((level) => ({ factor, settings: { ...start, [factor]: level } })));
}

describe('Lesson 5 string tasks', () => {
  it('starts task 1 at 147 Гц and task 2 at 880 Гц', () => {
    expect(stringFrequency(higher.task.model.start)).toBe(147);
    expect(stringFrequency(lower.task.model.start)).toBe(880);
  });

  it('never counts the start state itself as solved', () => {
    for (const task of tasks) expect(taskSolved(task.model, task.model.start)).toBe(false);
  });

  it('gives each task two independent routes, one per free factor', () => {
    for (const task of tasks) {
      const free = factorOrder.filter((factor) => factor !== task.model.lockedFactor);
      const solving = singleMoves(task.model.start, task.model.lockedFactor).filter((move) => taskSolved(task.model, move.settings));
      expect(Array.from(new Set(solving.map((move) => move.factor)))).toEqual(free);
    }
  });

  it('reaches the frequencies the lesson names on each route', () => {
    const start1 = higher.task.model.start;
    expect(stringFrequency({ ...start1, length: 0.5 })).toBe(220);
    expect(stringFrequency({ ...start1, tension: 2.25 })).toBe(220);
    expect(stringFrequency({ ...start1, tension: 4 })).toBe(293);
    const start2 = lower.task.model.start;
    expect(stringFrequency({ ...start2, tension: 2.25 })).toBe(660);
    expect(stringFrequency({ ...start2, tension: 1 })).toBe(440);
    expect(stringFrequency({ ...start2, density: 2.25 })).toBe(587);
    expect(stringFrequency({ ...start2, density: 4 })).toBe(440);
    expect(stringFrequency({ ...start2, tension: 1, density: 4 })).toBe(220);
  });

  it('refuses a solution that moves the locked factor', () => {
    for (const task of tasks) {
      const locked = task.model.lockedFactor;
      for (const level of levelsOf[locked]) {
        if (level === task.model.start[locked]) continue;
        for (const move of [{ ...task.model.start, [locked]: level }, ...singleMoves(task.model.start, locked).map((item) => ({ ...item.settings, [locked]: level }))]) {
          expect(taskSolved(task.model, move)).toBe(false);
        }
      }
    }
  });

  it('refuses a pitch moved the wrong way', () => {
    // Task 1 asks for a higher sound; the full length drops it to 110 Гц instead.
    const wrongWay: StringSettings = { ...higher.task.model.start, length: 1 };
    expect(stringFrequency(wrongWay)).toBe(110);
    expect(taskSolved(higher.task.model, wrongWay)).toBe(false);
    // Task 2 asks for a lower one: every free move goes down, so only the unchanged
    // start can fail by direction, and it does.
    for (const move of singleMoves(lower.task.model.start, 'length')) {
      expect(stringFrequency(move.settings)).toBeLessThan(880);
    }
  });
});
