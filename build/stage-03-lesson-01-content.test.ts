import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { noteOptions } from '../src/components/lesson/fret-explorer/utils/choices.ts';
import { checkpointFindNote, checkpointNoteFret, lessonElevenContent, predictFrets } from '../src/data/lessons/stage-03-lesson-01/constants.ts';
import { fifthString } from '../src/data/lessons/stage-03-lesson-01-model/constants.ts';
import { fretsForNote, noteAtFret } from '../src/data/lessons/stage-03-lesson-01-model/utils/frets.ts';
import { productionProgressCatalog } from '../server/progress-catalog.ts';
import { lessonElevenStepOrder } from '../src/progress/stage-03-lesson-01/constants.ts';

const forbidden = /стрій|строй|мензур|інтервал|2\^\(1\/12\)|каподастр|барре|табулатур|тембр/i;

describe('Lesson 11 content', () => {
  it('uses no terms from later lessons', () => {
    const dir = new URL('../src/data/lessons/stage-03-lesson-01/', import.meta.url);
    for (const file of readdirSync(dir)) expect(readFileSync(new URL(file, dir), 'utf8')).not.toMatch(forbidden);
  });

  it('keeps flats out of the learner text', () => {
    expect(JSON.stringify(lessonElevenContent, (_key, value) => typeof value === 'function' ? undefined : value)).not.toContain('♭');
  });

  it('matches the server catalog step order', () => {
    expect(productionProgressCatalog.get('stage-03-lesson-01')?.stepIds).toEqual([...lessonElevenStepOrder]);
  });

  it('gives every predict task the right note among its options', () => {
    for (const fret of predictFrets) {
      const options = noteOptions(fifthString.openKey, fret);
      expect(options).toContain(noteAtFret(fifthString.openKey, fret));
      expect(options.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('has one right answer for each checkpoint task', () => {
    const { noteTask } = lessonElevenContent.checkpoint;
    expect(noteTask.correctChoiceId).toBe(noteAtFret(fifthString.openKey, checkpointNoteFret));
    expect(noteTask.choices.filter((choice) => choice.id === noteTask.correctChoiceId)).toHaveLength(1);
    expect(fretsForNote(fifthString.openKey, checkpointFindNote)).toEqual([5]);
  });
});
