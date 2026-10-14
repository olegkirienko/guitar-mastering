import { useState } from 'react';
import type { FretCheckpointProps, FretTaskId } from '@/components/lesson/fret-checkpoint/types';
import { fretsForNote, noteAtFret } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';
import type { FretNote } from '@/data/lessons/stage-03-lesson-01-model/types';

const taskIds: readonly FretTaskId[] = ['note', 'find', 'twelve'];

export function useFretCheckpoint({ openString, findNote, onPass }: Pick<FretCheckpointProps, 'openString' | 'findNote' | 'onPass'>) {
  // Session-only: only the fact of passing is saved, never the answers or the attempts.
  const [solved, setSolved] = useState<readonly FretTaskId[]>([]);
  const [fret, setFret] = useState(0);
  const [verdict, setVerdict] = useState<{ fret: number; right: boolean } | null>(null);

  const solve = (id: FretTaskId) => {
    if (solved.includes(id)) return;
    const next = [...solved, id];
    setSolved(next);
    if (taskIds.every((task) => next.includes(task))) onPass();
  };
  const answer = (id: FretTaskId) => (_choiceId: string, isCorrect: boolean) => {
    if (isCorrect) solve(id);
  };
  const selectFret = (next: number) => {
    setFret(next);
    setVerdict(null);
  };
  // Fret 0 and fret 12 both hold the open note, so every fret that carries the note is right.
  const checkFret = () => {
    const right = fretsForNote(openString.openKey, findNote as FretNote).includes(fret);
    setVerdict({ fret, right });
    if (right) solve('find');
  };

  return { solved, fret, verdict, selectFret, checkFret, answer, noteOfFret: noteAtFret(openString.openKey, fret) };
}
