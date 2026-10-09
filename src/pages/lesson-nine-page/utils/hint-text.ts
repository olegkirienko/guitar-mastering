import type { NoteName } from '@/data/lessons/stage-02-lesson-03-model/types';
import type { MoveHint } from '@/pages/lesson-nine-page/types';

export interface MoveHintTexts {
  start: string;
  onWhite: (letter: NoteName) => string;
  noBlack: (letter: NoteName) => string;
  found: (letter: NoteName) => string;
  miss: (letter: NoteName) => string;
  pickWhite: string;
}

export function hintText(texts: MoveHintTexts, hint: MoveHint): string {
  switch (hint.kind) {
    case 'start': return texts.start;
    case 'pickWhite': return texts.pickWhite;
    case 'onWhite': return texts.onWhite(hint.letter);
    case 'noBlack': return texts.noBlack(hint.letter);
    case 'found': return texts.found(hint.letter);
    case 'miss': return texts.miss(hint.letter);
  }
}
