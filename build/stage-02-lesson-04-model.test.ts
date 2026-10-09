import { describe, expect, it } from 'vitest';
import { checkpointPairs, edgeCases, flatPairs, lessonNineContent, sharpPairs } from '../src/data/lessons/stage-02-lesson-04/constants.ts';
import { noteNames } from '../src/data/lessons/stage-02-lesson-03-model/constants.ts';
import { areEnharmonic, flatOf, keyOfSpelledName, namesOfKey, sharpOf, whiteLetterOf } from '../src/data/lessons/stage-02-lesson-04-model/utils/names.ts';
import { gradeNames, gradePairs } from '../src/components/lesson/accidental-checkpoint/utils/grading.ts';
import { applyMovePress, initialMove } from '../src/pages/lesson-nine-page/utils/moves.ts';

describe('Lesson 9 spelled names', () => {
  it('raises and lowers each letter by one semitone, wrapping at the octave', () => {
    expect(noteNames.map(sharpOf)).toEqual([1, 3, 5, 6, 8, 10, 0]);
    expect(noteNames.map(flatOf)).toEqual([11, 1, 3, 4, 6, 8, 10]);
  });

  it('gives all twelve keys their names: five pairs and seven single letters', () => {
    expect(Array.from({ length: 12 }, (_, key) => namesOfKey(key))).toEqual([
      ['C'], ['C♯', 'D♭'], ['D'], ['D♯', 'E♭'], ['E'], ['F'], ['F♯', 'G♭'], ['G'], ['G♯', 'A♭'], ['A'], ['A♯', 'B♭'], ['B'],
    ]);
  });

  it('maps signs on the edges of the black keys to white keys', () => {
    expect(keyOfSpelledName('E♯')).toBe(keyOfSpelledName('F'));
    expect(keyOfSpelledName('B♯')).toBe(0);
    expect(keyOfSpelledName('C♭')).toBe(11);
    expect(keyOfSpelledName('F♭')).toBe(4);
    expect(keyOfSpelledName('C♮')).toBe(0);
    expect(keyOfSpelledName('H')).toBeNull();
    expect(whiteLetterOf('E♯')).toBe('F');
    expect(whiteLetterOf('C♯')).toBeNull();
  });

  it('knows enharmonic names, including false pairs', () => {
    expect(areEnharmonic('C♯', 'D♭')).toBe(true);
    expect(areEnharmonic('E♯', 'F')).toBe(true);
    expect(areEnharmonic('C♯', 'E♭')).toBe(false);
    expect(areEnharmonic('C♯', 'D♯')).toBe(false);
    expect(areEnharmonic('C♯', 'nope')).toBe(false);
  });
});

describe('Lesson 9 tasks', () => {
  it('pairs every sharp on `same` with exactly one flat', () => {
    for (const sharp of sharpPairs) expect(flatPairs.filter((flat) => areEnharmonic(sharp, flat))).toHaveLength(1);
  });

  it('lands each edge case on a white key and gives checkpoint pairs a split answer', () => {
    for (const name of edgeCases) expect(whiteLetterOf(name)).not.toBeNull();
    const same = checkpointPairs.filter(([first, second]) => areEnharmonic(first, second));
    expect(same).toHaveLength(2);
    expect(checkpointPairs.length - same.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps one unambiguous answer in every checkpoint task', () => {
    const { names, find, natural } = lessonNineContent.checkpoint;
    expect(names.correct).toEqual(namesOfKey(names.highlightKey));
    expect(find.targetKey).toBe(keyOfSpelledName('G♭'));
    expect(natural.choices.filter((choice) => choice.id === natural.correctChoiceId)).toHaveLength(1);
    expect(natural.correctChoiceId).toBe(whiteLetterOf('E♯'));
    expect(lessonNineContent.edges.control.correctChoiceId).toBe(whiteLetterOf('B♯'));
    for (const item of lessonNineContent.checkpoint.pairs.items) expect(item.same).toBe(areEnharmonic(item.first, item.second));
  });

  it('grades a set of names and the pair answers', () => {
    expect(gradeNames(['G♭', 'F♯'], ['F♯', 'G♭'])).toBe(true);
    expect(gradeNames(['F♯'], ['F♯', 'G♭'])).toBe(false);
    expect(gradeNames(['F♯', 'G♭', 'G♯'], ['F♯', 'G♭'])).toBe(false);
    expect(gradePairs({ 0: true, 1: false }, [true, false])).toBe(true);
    expect(gradePairs({ 0: true }, [true, false])).toBe(false);
  });
});

describe('Lesson 9 moves on the keys', () => {
  it('finds a sharp by a white key and the black key a semitone above', () => {
    const started = applyMovePress(initialMove, 0, 'up');
    expect(started.hint).toEqual({ kind: 'onWhite', letter: 'C' });
    const found = applyMovePress(started, 1, 'up');
    expect(found.found).toEqual(['C']);
    expect(found.from).toBeNull();
    expect(found.hint).toEqual({ kind: 'found', letter: 'C' });
  });

  it('finds a flat going down, and does not repeat a found letter', () => {
    const once = applyMovePress(applyMovePress(initialMove, 2, 'down'), 1, 'down');
    expect(once.found).toEqual(['D']);
    expect(applyMovePress(applyMovePress(once, 2, 'down'), 1, 'down').found).toEqual(['D']);
  });

  it('answers a white key, a wrong black key, and a black key with no start without penalty', () => {
    expect(applyMovePress(initialMove, 1, 'up').hint).toEqual({ kind: 'pickWhite' });
    expect(applyMovePress(applyMovePress(initialMove, 0, 'up'), 3, 'up').hint).toEqual({ kind: 'miss', letter: 'C' });
    expect(applyMovePress(initialMove, 4, 'up').hint).toEqual({ kind: 'noBlack', letter: 'E' });
    expect(applyMovePress(initialMove, 5, 'down').hint).toEqual({ kind: 'noBlack', letter: 'F' });
  });
});

describe('Lesson 9 terminology', () => {
  const forbidden = /(^|[^а-яіїєґ])лад|гриф|інтервал|гама|тональн|акорд|ключов|подвійн/i;
  const strings = (value: unknown): string[] => typeof value === 'string' ? [value]
    : Array.isArray(value) ? value.flatMap(strings)
      : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
  // The reminder on `intro` is the previous lesson's bridge, not this lesson's text.
  const section = (...names: ('intro' | 'raise' | 'lower' | 'same')[]) => names.flatMap((name) => strings(name === 'intro' ? { ...lessonNineContent.intro, reminder: '' } : lessonNineContent[name]));
  const sharp = /♯|дієз/i;
  const flat = /♭|бемол/i;
  const natural = /♮|бекар/i;
  const later = /енгармон|рівномірн/i;

  it('keeps the words of other stages out of the whole content', () => {
    expect(strings(lessonNineContent).filter((text) => forbidden.test(text))).toEqual([]);
  });

  it('brings each sign only after the experience that motivates it', () => {
    expect(section('intro').filter((text) => sharp.test(text) || flat.test(text) || natural.test(text) || later.test(text))).toEqual([]);
    expect(section('raise').filter((text) => flat.test(text) || natural.test(text) || later.test(text) || /E♯|B♯/.test(text))).toEqual([]);
    expect(section('lower').filter((text) => natural.test(text) || later.test(text))).toEqual([]);
    expect(section('same').filter((text) => natural.test(text))).toEqual([]);
    expect(strings(lessonNineContent.same).some((text) => later.test(text))).toBe(true);
    expect(strings(lessonNineContent.edges).some((text) => natural.test(text))).toBe(true);
  });
});
