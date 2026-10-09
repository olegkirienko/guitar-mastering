import { useState } from 'react';
import type { NoteNameCheckpointProps } from '@/components/lesson/note-name-checkpoint/types';

export function useNoteNameCheckpoint({ content, onPass }: Pick<NoteNameCheckpointProps, 'content' | 'onPass'>) {
  // Session-only: only the fact of passing is saved, never the answers or the attempts.
  const [solved, setSolved] = useState<readonly string[]>([]);

  const answer = (taskId: string, isCorrect: boolean) => {
    if (!isCorrect || solved.includes(taskId)) return;
    const next = [...solved, taskId];
    setSolved(next);
    if (content.tasks.every((task) => next.includes(task.id))) onPass();
  };

  return { solved, answer };
}
