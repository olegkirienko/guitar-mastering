import { useState } from 'react';
import type { ExplorerMode, FretExplorerProps } from '@/components/lesson/fret-explorer/types';
import { lastFret } from '@/data/lessons/stage-03-lesson-01-model/constants';

export function useFretExplorer({ predictFrets, onPlay, onSolved, openString }: Pick<FretExplorerProps, 'predictFrets' | 'onPlay' | 'onSolved' | 'openString'>) {
  // Session-only: nothing here is saved.
  const [mode, setMode] = useState<ExplorerMode>('explore');
  const [fret, setFret] = useState(0);
  const [task, setTask] = useState(0);
  const [taskSolved, setTaskSolved] = useState(false);
  const [allSolved, setAllSolved] = useState(false);

  const selectFret = (next: number) => setFret(Math.min(lastFret, Math.max(0, Math.round(next))));
  const pressKey = (key: number) => {
    selectFret(key);
    onPlay(openString.frequency * 2 ** (key / 12));
  };
  const answer = (isCorrect: boolean) => {
    if (!isCorrect) return;
    setTaskSolved(true);
    if (task === predictFrets.length - 1) {
      setAllSolved(true);
      onSolved();
    }
  };
  const nextTask = () => {
    setTask((current) => current + 1);
    setTaskSolved(false);
  };

  return { mode, setMode, fret, selectFret, pressKey, task, taskSolved, allSolved, answer, nextTask };
}
