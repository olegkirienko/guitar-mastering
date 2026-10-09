import { useState } from 'react';
import type { OctaveLabProps } from '@/components/lesson/octave-lab/types';
import { gradeOctave } from '@/components/lesson/octave-lab/utils/grading';
import type { CheckpointVerdict } from '@/data/lessons/stage-02-lesson-02-model/utils/checkpoint';
import { octaveTasks } from '@/data/lessons/stage-02-lesson-05/constants';

export function useOctaveLab({ onSolved }: Pick<OctaveLabProps, 'onSolved'>) {
  // Session-only: typed values and attempts are never saved.
  const [values, setValues] = useState<Readonly<Record<string, string>>>({});
  const [verdicts, setVerdicts] = useState<Readonly<Record<string, CheckpointVerdict>>>({});
  const [shown, setShown] = useState<readonly string[]>([]);

  const isSolved = (id: string, nextVerdicts = verdicts, nextShown = shown) => nextVerdicts[id] === 'right' || nextShown.includes(id);
  const report = (nextVerdicts: Readonly<Record<string, CheckpointVerdict>>, nextShown: readonly string[]) => {
    if (octaveTasks.every((task) => isSolved(task.id, nextVerdicts, nextShown))) onSolved();
  };

  const setValue = (id: string, value: string) => setValues((current) => ({ ...current, [id]: value }));
  const check = (id: string) => {
    const task = octaveTasks.find((candidate) => candidate.id === id);
    if (!task) return;
    const verdict = gradeOctave(task, values[id] ?? '');
    const next = { ...verdicts, [id]: verdict };
    setVerdicts(next);
    report(next, shown);
  };
  const show = (id: string) => {
    const next = shown.includes(id) ? shown : [...shown, id];
    setShown(next);
    report(verdicts, next);
  };

  return { values, setValue, verdicts, shown, isSolved: (id: string) => isSolved(id), check, show };
}
