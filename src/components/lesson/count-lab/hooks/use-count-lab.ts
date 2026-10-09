import { useState } from 'react';
import { gradeCount } from '@/components/lesson/count-lab/utils/grading';
import type { CountLabProps } from '@/components/lesson/count-lab/types';
import type { CheckpointVerdict } from '@/data/lessons/stage-02-lesson-02-model/utils/checkpoint';
import { countTasks } from '@/data/lessons/stage-02-lesson-05/constants';

interface Fields { semitones: string; tones: string }
const emptyFields: Fields = { semitones: '', tones: '' };

export function useCountLab({ onSolved }: Pick<CountLabProps, 'onSolved'>) {
  // Session-only: typed values and attempts are never saved.
  const [values, setValues] = useState<Readonly<Record<string, Fields>>>({});
  const [verdicts, setVerdicts] = useState<Readonly<Record<string, CheckpointVerdict>>>({});
  const [shown, setShown] = useState<readonly string[]>([]);

  const isSolved = (id: string, nextVerdicts = verdicts, nextShown = shown) => nextVerdicts[id] === 'right' || nextShown.includes(id);
  const report = (nextVerdicts: Readonly<Record<string, CheckpointVerdict>>, nextShown: readonly string[]) => {
    if (countTasks.every((task) => isSolved(task.id, nextVerdicts, nextShown))) onSolved();
  };

  const setValue = (id: string, field: keyof Fields, value: string) => setValues((current) => ({ ...current, [id]: { ...(current[id] ?? emptyFields), [field]: value } }));
  const check = (id: string) => {
    const task = countTasks.find((candidate) => candidate.id === id);
    if (!task) return;
    const fields = values[id] ?? emptyFields;
    const next = { ...verdicts, [id]: gradeCount(task, fields.semitones, fields.tones) };
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
