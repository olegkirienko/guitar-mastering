import { useState } from 'react';
import type { AccidentalCheckpointProps, TaskId, Verdict } from '@/components/lesson/accidental-checkpoint/types';
import { gradeNames, gradePairs } from '@/components/lesson/accidental-checkpoint/utils/grading';

const taskIds: readonly TaskId[] = ['names', 'find', 'pairs', 'natural'];

export function useAccidentalCheckpoint({ content, keys, onPass }: Pick<AccidentalCheckpointProps, 'content' | 'keys' | 'onPass'>) {
  // Session-only: only the fact of passing is saved, never the answers or the attempts.
  const [solved, setSolved] = useState<readonly TaskId[]>([]);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [namesVerdict, setNamesVerdict] = useState<Verdict>(null);
  const [pressedKey, setPressedKey] = useState<number | null>(null);
  const [pairAnswers, setPairAnswers] = useState<Readonly<Record<number, boolean>>>({});

  const solve = (id: TaskId) => {
    if (solved.includes(id)) return;
    const next = [...solved, id];
    setSolved(next);
    if (taskIds.every((task) => next.includes(task))) onPass();
  };

  const togglePicked = (name: string) => {
    setNamesVerdict(null);
    setPicked((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };
  const checkNames = () => {
    const right = gradeNames(picked, content.names.correct);
    setNamesVerdict(right ? 'right' : 'wrong');
    if (right) solve('names');
  };

  const pressKey = (key: number) => {
    keys.onPlay(key);
    setPressedKey(key);
    if (key === content.find.targetKey) solve('find');
  };

  const answerPair = (index: number, same: boolean) => {
    const next = { ...pairAnswers, [index]: same };
    setPairAnswers(next);
    if (gradePairs(next, content.pairs.items.map((item) => item.same))) solve('pairs');
  };

  return { solved, picked, namesVerdict, pressedKey, pairAnswers, togglePicked, checkNames, pressKey, answerPair, answerNatural: (isCorrect: boolean) => { if (isCorrect) solve('natural'); } };
}
