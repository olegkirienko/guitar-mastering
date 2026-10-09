import { noteNameOf } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { whitePairs } from '@/data/lessons/stage-02-lesson-03-model/utils/pairs';

export const pairs = whitePairs();

// Indexes of the pairs with no black key between them: exactly the ones one semitone wide.
export const closePairIndexes: readonly number[] = pairs.flatMap((pair, index) => pair.semitones === 1 ? [index] : []);

export function pairNames(index: number): [string, string] {
  const { from, to } = pairs[index];
  return [noteNameOf(from) ?? '', noteNameOf(to) ?? ''];
}

// Right when exactly the close pairs are picked, nothing more, nothing less.
export function gradePicked(picked: readonly number[]): boolean {
  return picked.length === closePairIndexes.length && closePairIndexes.every((index) => picked.includes(index));
}
