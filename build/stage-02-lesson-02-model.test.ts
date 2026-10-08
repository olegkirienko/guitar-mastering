import { describe, expect, it } from 'vitest';
import { baseFrequency } from '../src/data/lessons/stage-02-lesson-02-model/constants.ts';
import { gradeDistance, gradeKeyAfter, gradeReturn, parseNumber, parseWhole } from '../src/data/lessons/stage-02-lesson-02-model/utils/checkpoint.ts';
import { keyAfter, keyFrequency, semitoneDistance, stepTable } from '../src/data/lessons/stage-02-lesson-02-model/utils/keys.ts';
import { lessonSevenContent } from '../src/data/lessons/stage-02-lesson-02/constants.ts';

describe('keyFrequency', () => {
  it('starts at the base, doubles at key 12 and follows 2^(n/12)', () => {
    expect(keyFrequency(440, 0)).toBe(440);
    expect(keyFrequency(440, 12)).toBeCloseTo(880, 9);
    expect(keyFrequency(440, 7)).toBeCloseTo(659.26, 2);
  });
});

describe('semitoneDistance and keyAfter', () => {
  it('uses the difference of key numbers', () => {
    expect(semitoneDistance(2, 7)).toBe(5);
    expect(semitoneDistance(7, 2)).toBe(5);
  });

  it('stays on the keyboard', () => {
    expect(keyAfter(3, 5)).toBe(8);
    expect(keyAfter(8, 5)).toBeNull();
    expect(keyAfter(0, 12)).toBe(12);
    expect(keyAfter(0, 1.5)).toBeNull();
  });
});

describe('stepTable', () => {
  it('has 13 rows with a constant ratio and growing differences', () => {
    const rows = stepTable(baseFrequency);
    expect(rows).toHaveLength(13);
    expect(rows[0]).toMatchObject({ difference: null, ratio: null });
    for (const row of rows.slice(1)) expect(row.ratio).toBeCloseTo(1.0595, 4);
    expect(rows[1].difference).toBeCloseTo(26.2, 1);
    expect(rows[2].difference ?? 0).toBeGreaterThan(rows[1].difference ?? 0);
  });
});

describe('checkpoint grading', () => {
  it('reads numbers with a comma, rounds whole answers and skips empty ones', () => {
    expect(parseNumber('2,5')).toBe(2.5);
    expect(parseNumber('  ')).toBeNull();
    expect(parseWhole('4.6')).toBe(5);
  });

  it('grades the three tasks', () => {
    expect(gradeDistance(2, 7, '5', '2,5')).toBe('right');
    expect(gradeDistance(2, 7, '5', '5')).toBe('wrong');
    expect(gradeDistance(2, 7, '', '2,5')).toBe('empty');
    expect(gradeKeyAfter(3, 5, '8')).toBe('right');
    expect(gradeKeyAfter(3, 5, '13')).toBe('range');
    expect(gradeKeyAfter(3, 5, '7')).toBe('wrong');
    expect(gradeReturn('12', 12)).toBe('right');
    expect(gradeReturn('-1', 12)).toBe('range');
    expect(gradeReturn('8', 12)).toBe('wrong');
  });
});

describe('lesson 7 content terminology', () => {
  const text = JSON.stringify(lessonSevenContent);
  const letter = (word: string) => new RegExp(`(?<![а-яіїєґa-z])${word}`, 'iu');

  it('uses none of the words that belong to later lessons', () => {
    for (const word of ['дієз', 'бемол', 'бекар', 'енгармон', 'стрій', 'темпера', 'лад', 'гриф', 'інтервал', 'гама']) {
      expect(text, word).not.toMatch(letter(word));
    }
  });

  it('names no note by letter or by syllable', () => {
    expect(text).not.toMatch(/(?<![A-Za-z])[A-G](?![A-Za-z])/);
    expect(text).not.toMatch(/(?<![а-яіїєґ])(до|ре|мі|фа|соль|сі|ля)(?![а-яіїєґ])\s*-?\s*(ре|мі|фа|соль|ля|сі)/iu);
  });

  it('introduces the semitone only on its own screen', () => {
    const { semitone, ...before } = lessonSevenContent;
    expect(semitone.term).toMatch(/півтон/);
    for (const key of ['intro', 'keys', 'steps', 'compare'] as const) expect(JSON.stringify(before[key])).not.toMatch(/півтон|тон(?![а-яіїєґ])/iu);
  });
});
