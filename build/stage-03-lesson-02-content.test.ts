import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lessonTwelveContent } from '../src/data/lessons/stage-03-lesson-02/constants.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';
import { lessonTwelveStepOrder } from '../src/progress/stage-03-lesson-02/constants.ts';

const forbidden = /інтервал|кварт|квінт|терці|унісон|каподастр|барре|табулатур|тембр|гама|акорд|позиці/i;
const tuningWord = /стр[ійо]/i;
const plain = (value: unknown) => JSON.stringify(value, (_key, item) => typeof item === 'function' ? undefined : item);

describe('Lesson 12 content', () => {
  it('uses no terms from later lessons', () => {
    const dir = new URL('../src/data/lessons/stage-03-lesson-02/', import.meta.url);
    for (const file of readdirSync(dir)) expect(readFileSync(new URL(file, dir), 'utf8')).not.toMatch(forbidden);
  });

  it('names the tuning only after the pattern is found', () => {
    const { intro, strings, link } = lessonTwelveContent;
    for (const step of [intro, strings, link]) expect(plain(step)).not.toMatch(tuningWord);
    expect(plain(lessonTwelveContent.pattern)).toMatch(tuningWord);
  });

  it('keeps flats out of the learner text', () => {
    expect(plain(lessonTwelveContent)).not.toContain('♭');
  });

  it('matches the server catalog step order', () => {
    expect(productionProgressCatalog.get('stage-03-lesson-02')?.stepIds).toEqual([...lessonTwelveStepOrder]);
  });

  it('has exactly one right answer in every checkpoint question', () => {
    for (const task of lessonTwelveContent.checkpoint.tasks) {
      for (const question of task.questions) {
        expect(question.choices.filter((choice) => choice.id === question.correctChoiceId)).toHaveLength(1);
      }
    }
  });

  it('pairs every string number with a thick or thin word', () => {
    const { map, strings } = lessonTwelveContent;
    for (const number of [1, 2, 3, 4, 5, 6]) {
      const word = number >= 4 ? 'товста' : 'тонка';
      expect(map.weight(number)).toBe(word);
      expect(map.describeString(number, null, null)).toContain(word);
      expect(map.describeString(number, 'E', 82)).toContain(word);
      expect(strings.orderItem(number, 1)).toContain(word);
    }
  });
});
