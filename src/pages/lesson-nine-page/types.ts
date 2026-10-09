import type { NoteName } from '@/data/lessons/stage-02-lesson-03-model/types';

// What the status line under the keys should say after the last press.
export type MoveHint =
  | { kind: 'start' }
  | { kind: 'onWhite'; letter: NoteName }
  | { kind: 'noBlack'; letter: NoteName }
  | { kind: 'found'; letter: NoteName }
  | { kind: 'miss'; letter: NoteName }
  | { kind: 'pickWhite' };

export interface MoveState {
  // The white key the learner started from, until a black key answers it.
  from: NoteName | null;
  found: readonly NoteName[];
  hint: MoveHint;
}
