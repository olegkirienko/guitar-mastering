import { describe, expect, it } from 'vitest';
import { maxFrequency, minFrequency } from '../src/data/lessons/stage-02-lesson-01-model/constants.ts';
import { clampFrequency, isOctaveOf, octaveOf } from '../src/data/lessons/stage-02-lesson-01-model/utils/octave.ts';
import { lessonSixContent } from '../src/data/lessons/stage-02-lesson-01/constants.ts';

describe('octaveOf', () => {
  it('doubles going up and halves going down', () => {
    expect(octaveOf(440, 'up')).toBe(880);
    expect(octaveOf(440, 'down')).toBe(220);
    expect(octaveOf(220, 'down')).toBe(110);
  });

  it('stops at the edges of the range', () => {
    expect(octaveOf(maxFrequency, 'up')).toBeNull();
    expect(octaveOf(minFrequency, 'down')).toBeNull();
    expect(octaveOf(880, 'up')).toBe(maxFrequency);
    expect(octaveOf(110, 'down')).toBe(minFrequency);
  });
});

describe('isOctaveOf', () => {
  it('accepts 2:1 in either order and rejects other ratios', () => {
    expect(isOctaveOf(220, 440)).toBe(true);
    expect(isOctaveOf(880, 440)).toBe(true);
    expect(isOctaveOf(300, 450)).toBe(false);
    expect(isOctaveOf(440, 1320)).toBe(false);
  });

  it('allows a small deviation and rounds fractions', () => {
    expect(isOctaveOf(441, 880)).toBe(true);
    expect(isOctaveOf(300, 601)).toBe(true);
    expect(isOctaveOf(300, 610)).toBe(false);
    expect(isOctaveOf(330.4, 660)).toBe(true);
  });
});

describe('clampFrequency', () => {
  it('keeps whole hertz inside the range', () => {
    expect(clampFrequency(10)).toBe(minFrequency);
    expect(clampFrequency(5000)).toBe(maxFrequency);
    expect(clampFrequency(440.6)).toBe(441);
  });
});

describe('lesson content agrees with the model', () => {
  it('marks as correct exactly the octaves the model accepts', () => {
    const { octave, checkpoint } = lessonSixContent;
    expect(isOctaveOf(octave.base, Number(octave.question.correctChoiceId))).toBe(true);
    for (const choice of octave.question.choices) {
      expect(isOctaveOf(octave.base, Number(choice.id))).toBe(choice.id === octave.question.correctChoiceId);
    }
    for (const task of checkpoint.find) {
      for (const choice of task.choices) {
        expect(isOctaveOf(checkpoint.base, Number(choice.id))).toBe(choice.id === task.correctChoiceId);
      }
    }
    for (const pair of checkpoint.pairs.items) {
      expect(isOctaveOf(pair.low, pair.high)).toBe(pair.isOctave);
    }
  });
});
