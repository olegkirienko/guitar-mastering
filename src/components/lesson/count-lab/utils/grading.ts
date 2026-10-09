import { parseNumber, parseWhole } from '@/data/lessons/stage-02-lesson-02-model/utils/checkpoint';
import type { CheckpointVerdict } from '@/data/lessons/stage-02-lesson-02-model/utils/checkpoint';
import type { CountTask } from '@/data/lessons/stage-02-lesson-05/types';
import { keyOfSpelledName } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

// Semitones counted upward from the first name to the second, over the edge of the octave if needed.
export function countSemitones(task: CountTask): number {
  const from = keyOfSpelledName(task.from);
  const to = keyOfSpelledName(task.to);
  if (from === null || to === null) throw new Error(`Count task ${task.id} has an unreadable name`);
  return (to - from + 12) % 12;
}

export function gradeCount(task: CountTask, semitonesInput: string, tonesInput: string): CheckpointVerdict {
  const semitones = parseWhole(semitonesInput);
  const tones = parseNumber(tonesInput);
  if (semitones === null || tones === null) return 'empty';
  const distance = countSemitones(task);
  return semitones === distance && Math.abs(tones - distance / 2) < 1e-9 ? 'right' : 'wrong';
}
