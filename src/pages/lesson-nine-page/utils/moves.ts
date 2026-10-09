import { keysInOctave } from '@/data/lessons/stage-02-lesson-03-model/constants';
import { isWhiteKey, noteNameOf } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import type { MoveDirection } from '@/data/lessons/stage-02-lesson-04-model/types';
import { flatOf, sharpOf } from '@/data/lessons/stage-02-lesson-04-model/utils/names';
import type { MoveState } from '@/pages/lesson-nine-page/types';

export const initialMove: MoveState = { from: null, found: [], hint: { kind: 'start' } };

// A white key starts a move; the black key a semitone away in the direction answers it.
export function applyMovePress(state: MoveState, key: number, direction: MoveDirection): MoveState {
  const letter = noteNameOf(key);
  if (letter !== null) {
    const target = direction === 'up' ? sharpOf(letter) : flatOf(letter);
    return { ...state, from: letter, hint: { kind: isWhiteKey(target) ? 'noBlack' : 'onWhite', letter } };
  }
  if (state.from === null) return { ...state, hint: { kind: 'pickWhite' } };
  const target = direction === 'up' ? sharpOf(state.from) : flatOf(state.from);
  if (target !== key % keysInOctave) return { ...state, hint: { kind: 'miss', letter: state.from } };
  return {
    from: null,
    found: state.found.includes(state.from) ? state.found : [...state.found, state.from],
    hint: { kind: 'found', letter: state.from },
  };
}
