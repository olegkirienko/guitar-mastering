import { pitchChange } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';
import type { CheckpointTask, StringSettings } from '@/data/lessons/stage-01-lesson-03-model/types';
import { stringFrequency } from '@/data/lessons/stage-01-lesson-03-model/utils/frequency';

// Solved when the pitch moved the asked way and the locked factor kept its start level.
export function taskSolved(task: CheckpointTask, settings: StringSettings): boolean {
  return settings[task.lockedFactor] === task.start[task.lockedFactor]
    && pitchChange(stringFrequency(task.start), stringFrequency(settings)) === task.direction;
}

// Both tasks solved and every guitar question answered correctly; attempts are unlimited.
export function checkpointPassed(solvedTaskIds: readonly string[], correctQuestionIds: readonly string[], taskIds: readonly string[], questionIds: readonly string[]): boolean {
  return taskIds.every((id) => solvedTaskIds.includes(id)) && questionIds.every((id) => correctQuestionIds.includes(id));
}
