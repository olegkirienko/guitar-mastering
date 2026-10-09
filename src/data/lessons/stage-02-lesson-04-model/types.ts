import type { NoteName } from '@/data/lessons/stage-02-lesson-03-model/types';

// A letter with an optional sign: `C`, `C♯`, `D♭`, `C♮`.
export type SpelledName = `${NoteName}${'' | '♯' | '♭' | '♮'}`;

export type MoveDirection = 'up' | 'down';
