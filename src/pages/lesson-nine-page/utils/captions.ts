import { whiteKeys } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { noteNameOf } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import type { NoteName } from '@/data/lessons/stage-02-lesson-03-model/types';
import { flatSign, sharpSign } from '@/data/lessons/stage-02-lesson-04-model/constants';
import { flatOf, sharpOf } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

// Names written over the keys: every white letter (known since lesson 3) and the signs the learner has found.
export function keyNames(sharps: readonly NoteName[], flats: readonly NoteName[]): Readonly<Record<number, readonly string[]>> {
  const names: Record<number, string[]> = {};
  for (const key of whiteKeys(0, 12)) names[key] = [noteNameOf(key) as string];
  for (const letter of sharps) names[sharpOf(letter)] = [...(names[sharpOf(letter)] ?? []), `${letter}${sharpSign}`];
  for (const letter of flats) names[flatOf(letter)] = [...(names[flatOf(letter)] ?? []), `${letter}${flatSign}`];
  return names;
}

export function toCaptions(names: Readonly<Record<number, readonly string[]>>): Readonly<Record<number, string>> {
  return Object.fromEntries(Object.entries(names).map(([key, lines]) => [key, lines.join('\n')]));
}
