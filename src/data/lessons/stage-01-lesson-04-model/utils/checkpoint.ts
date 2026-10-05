import { overtoneMultiples } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { OvertoneLevel, OvertoneMultiple, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

// The state a prediction is about. Only the overtones it names have to match, so
// «посилимо ×4 і ×5» is tested whatever the learner left on ×2 and ×3.
export type OvertoneTarget = Readonly<Partial<Record<OvertoneMultiple, OvertoneLevel>>>;

export function matchesOvertones(sound: TimbreSound, target: OvertoneTarget): boolean {
  return overtoneMultiples.every((multiple) => target[multiple] === undefined || sound.overtones[multiple] === target[multiple]);
}
