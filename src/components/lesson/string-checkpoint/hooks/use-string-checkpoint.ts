import { useState } from 'react';
import type { StringCheckpointProps } from '@/components/lesson/string-checkpoint/types';

export function useStringCheckpoint({ content, onPass }: Pick<StringCheckpointProps, 'content' | 'onPass'>) {
  // Session-only: only the fact of passing is saved, never the answers or the attempts.
  const [solved, setSolved] = useState<readonly string[]>([]);
  const total = content.tasks.reduce((sum, task) => sum + task.questions.length, 0);

  const answer = (id: string) => (_choiceId: string, isCorrect: boolean) => {
    if (!isCorrect || solved.includes(id)) return;
    const next = [...solved, id];
    setSolved(next);
    if (next.length === total) onPass();
  };

  return { solved, total, answer };
}
