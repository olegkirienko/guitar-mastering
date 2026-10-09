import { describe, expect, it } from 'vitest';
import { lessonEightContent, anchorShifts } from '../src/data/lessons/stage-02-lesson-03/constants.ts';
import { baseFrequency, keyOfA } from '../src/data/lessons/stage-02-lesson-03-model/constants.ts';
import { isBlackKey, isWhiteKey, keyOfName, noteNameOf, shiftWhite, whiteKeys, whiteStepSizes } from '../src/data/lessons/stage-02-lesson-03-model/utils/keys.ts';
import { gradePair, whitePairs } from '../src/data/lessons/stage-02-lesson-03-model/utils/pairs.ts';
import { keyFrequency } from '../src/data/lessons/stage-02-lesson-02-model/utils/keys.ts';

describe('Lesson 8 keyboard model', () => {
  it('finds seven white keys in an octave and a pair and a triple of black ones', () => {
    expect(whiteKeys(0, 11)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(whiteKeys(0, 12)).toHaveLength(8);
    expect([1, 3, 6, 8, 10].every(isBlackKey)).toBe(true);
    expect(isWhiteKey(12)).toBe(true);
    expect(isWhiteKey(-1)).toBe(false);
    expect(isWhiteKey(1.5)).toBe(false);
  });

  it('sizes the gaps between neighbouring white keys as 2-2-1-2-2-2-1', () => {
    expect(whiteStepSizes()).toEqual([2, 2, 1, 2, 2, 2, 1]);
    expect(whitePairs().map((pair) => pair.semitones)).toEqual([2, 2, 1, 2, 2, 2, 1]);
    const pair = whitePairs()[2];
    expect(gradePair(pair, 1)).toBe(true);
    expect(gradePair(pair, 2)).toBe(false);
  });

  it('names white keys and refuses black ones', () => {
    expect([0, 2, 4, 5, 7, 9, 11, 12].map(noteNameOf)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(noteNameOf(1)).toBeNull();
    expect(keyOfName('A')).toBe(keyOfA);
  });

  it('shifts a letter by semitones and rejects results on a black key', () => {
    expect(shiftWhite('C', 7)).toBe('G');
    expect(shiftWhite('A', -4)).toBe('F');
    expect(shiftWhite('A', -3)).toBeNull();
    expect(shiftWhite('A', 2)).toBe('B');
    expect(shiftWhite('A', 5)).toBe('D');
    expect(shiftWhite('A', -9)).toBe('C');
  });

  it('puts A at 440 Hz on key 9 from the C base', () => {
    expect(keyFrequency(baseFrequency, keyOfA)).toBeCloseTo(440, 1);
    expect(keyFrequency(baseFrequency, 12)).toBeCloseTo(baseFrequency * 2, 9);
  });

  it('keeps every anchor and checkpoint task on a white key with a correct answer', () => {
    for (const shift of anchorShifts) expect(shiftWhite('A', shift)).not.toBeNull();
    const answers = new Map<string, string>(lessonEightContent.checkpoint.tasks.map((task) => [task.id, task.correctChoiceId]));
    expect(answers.get('name')).toBe(noteNameOf(7));
    expect(answers.get('up')).toBe(shiftWhite('C', 7));
    expect(answers.get('down')).toBe(shiftWhite('A', -4));
    for (const task of lessonEightContent.checkpoint.tasks) {
      expect(task.choices.some((choice) => choice.id === task.correctChoiceId)).toBe(true);
    }
    for (const question of lessonEightContent.anchor.questions) {
      expect(question.choices.some((choice) => choice.id === question.correctChoiceId)).toBe(true);
    }
  });
});

describe('Lesson 8 terminology boundary', () => {
  const forbidden = /дієз|бемол|бекар|енгармон|♯|♭|стрій|темпера|(^|[^а-яіїєґ])лад|гриф|інтервал|гама|тональн|акорд/i;
  const letters = /(^|[^A-Za-z])[A-G]($|[^A-Za-z])/;
  const syllables = /(^|[^а-яіїєґ])(ре|мі|фа|соль|ля|сі)($|[^а-яіїєґ])/i;
  const strings = (value: unknown): string[] => typeof value === 'string' ? [value]
    : Array.isArray(value) ? value.flatMap(strings)
      : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
  const { intro, look, pattern } = lessonEightContent;

  it('keeps forbidden words out of the whole lesson content', () => {
    expect(strings(lessonEightContent).filter((text) => forbidden.test(text))).toEqual([]);
  });

  it('keeps letters and syllables of notes out of intro, look and pattern', () => {
    const early = [...strings({ ...intro, reminder: '' }), ...strings(look), ...strings(pattern)];
    expect(early.filter((text) => letters.test(text) || syllables.test(text))).toEqual([]);
  });
});
