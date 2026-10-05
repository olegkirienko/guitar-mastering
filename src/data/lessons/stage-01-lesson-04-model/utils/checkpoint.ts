import { overtoneMultiples } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { OvertoneLevel, OvertoneMultiple, PairResult, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';

// The state a prediction is about. Only the overtones it names have to match, so
// «посилимо ×4 і ×5» is tested whatever the learner left on ×2 and ×3.
export type OvertoneTarget = Readonly<Partial<Record<OvertoneMultiple, OvertoneLevel>>>;

export function matchesOvertones(sound: TimbreSound, target: OvertoneTarget): boolean {
  return overtoneMultiples.every((multiple) => target[multiple] === undefined || sound.overtones[multiple] === target[multiple]);
}

// Everything but the fundamental is the timbre: which overtones sound and how strongly,
// plus the two ends of the sound.
export function sameTimbre(first: TimbreSound, second: TimbreSound): boolean {
  return first.attack === second.attack
    && first.decay === second.decay
    && overtoneMultiples.every((multiple) => first.overtones[multiple] === second.overtones[multiple]);
}

// The task: one pitch, two timbres. The pitch is the fundamental, which always sounds.
export function checkPair(first: TimbreSound, second: TimbreSound): PairResult {
  if (first.fundamental !== second.fundamental) return 'differentPitch';
  return sameTimbre(first, second) ? 'sameTimbre' : 'solved';
}

// The task is done and every question has a correct answer; attempts are unlimited.
export function checkpointPassed(pairSolved: boolean, correctQuestionIds: readonly string[], questionIds: readonly string[]): boolean {
  return pairSolved && questionIds.every((id) => correctQuestionIds.includes(id));
}
