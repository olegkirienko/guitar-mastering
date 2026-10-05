import { pitchChange } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';

// Status text for a new frequency: the number first, then the direction against the previous one.
export function frequencyChangeText(from: number, to: number, words: { more: string; less: string; same: string }): string {
  const change = pitchChange(from, to);
  return `${to} Гц — ${change === 'higher' ? words.more : change === 'lower' ? words.less : words.same}`;
}
