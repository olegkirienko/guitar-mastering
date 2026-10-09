import { useState } from 'react';
import type { SemitoneCheckpointProps, TaskId } from '@/components/lesson/semitone-checkpoint/types';
import { keysInOctave } from '@/data/lessons/stage-02-lesson-02-model/constants';
import type { CheckpointVerdict } from '@/data/lessons/stage-02-lesson-02-model/utils/checkpoint';
import { gradeDistance, gradeKeyAfter, gradeReturn } from '@/data/lessons/stage-02-lesson-02-model/utils/checkpoint';

const taskIds: readonly TaskId[] = ['distance', 'after', 'return'];

export function useSemitoneCheckpoint({ content, onPass }: Pick<SemitoneCheckpointProps, 'content' | 'onPass'>) {
  // Session-only: only the fact of passing is saved, never the answers or the attempts.
  const [values, setValues] = useState({ semitones: '', tones: '', after: '', return: '' });
  const [verdicts, setVerdicts] = useState<Partial<Record<TaskId, CheckpointVerdict>>>({});

  const setValue = (field: keyof typeof values, value: string) => setValues((current) => ({ ...current, [field]: value }));

  const check = (task: TaskId) => {
    const verdict = task === 'distance'
      ? gradeDistance(content.task1.from, content.task1.to, values.semitones, values.tones)
      : task === 'after'
        ? gradeKeyAfter(content.task2.from, content.task2.steps, values.after)
        : gradeReturn(values.return, keysInOctave);
    if (verdict === 'empty') return;
    const next = { ...verdicts, [task]: verdict };
    setVerdicts(next);
    if (taskIds.every((id) => next[id] === 'right')) onPass();
  };

  return { values, setValue, verdicts, check };
}
