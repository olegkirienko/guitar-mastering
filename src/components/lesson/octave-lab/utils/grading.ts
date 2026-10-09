import { maxFrequency, minFrequency } from '@/data/lessons/stage-02-lesson-01-model/constants';
import { isOctaveOf, octaveOf } from '@/data/lessons/stage-02-lesson-01-model/utils/octave';
import { parseNumber } from '@/data/lessons/stage-02-lesson-02-model/utils/checkpoint';
import type { CheckpointVerdict } from '@/data/lessons/stage-02-lesson-02-model/utils/checkpoint';
import type { OctaveTask } from '@/data/lessons/stage-02-lesson-05/types';

// A number off the doubler's range is not a mistake, so it has its own verdict.
export function gradeOctave(task: OctaveTask, input: string): CheckpointVerdict {
  const value = parseNumber(input);
  if (value === null) return 'empty';
  if (value < minFrequency || value > maxFrequency) return 'range';
  const rightSide = task.direction === 'up' ? value > task.frequency : value < task.frequency;
  return rightSide && isOctaveOf(task.frequency, value) ? 'right' : 'wrong';
}

// The frequency the task asks for.
export function octaveAnswer(task: OctaveTask): number {
  const answer = octaveOf(task.frequency, task.direction);
  if (answer === null) throw new Error(`Octave task ${task.id} leaves the range`);
  return answer;
}
