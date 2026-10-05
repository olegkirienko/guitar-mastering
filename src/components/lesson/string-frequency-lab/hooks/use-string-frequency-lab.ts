import { useId, useState } from 'react';
import type { LabPrediction, StringFrequencyLabProps } from '@/components/lesson/string-frequency-lab/types';
import { pitchChange } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';
import { defaultStringSettings } from '@/data/lessons/stage-01-lesson-03-model/constants';
import type { StringFactor, StringSettings } from '@/data/lessons/stage-01-lesson-03-model/types';
import { frequencyChangeText } from '@/data/lessons/stage-01-lesson-03-model/utils/change';
import { taskSolved } from '@/data/lessons/stage-01-lesson-03-model/utils/checkpoint';
import { sameSettings, stringFrequency, withFactorLevel } from '@/data/lessons/stage-01-lesson-03-model/utils/frequency';

const noPredictions: readonly LabPrediction[] = [];

export function useStringFrequencyLab({ content, predictions = noPredictions, task, completed, onComplete }: Pick<StringFrequencyLabProps, 'content' | 'predictions' | 'task' | 'completed' | 'onComplete'>) {
  const titleId = useId();
  const start = task?.model.start ?? defaultStringSettings;
  const [settings, setSettings] = useState(start);
  const [lastChanged, setLastChanged] = useState<StringFactor | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // A prediction counts as tested only when its state is reached after the guess.
  const [answered, setAnswered] = useState<readonly string[]>([]);
  const [verified, setVerified] = useState<readonly string[]>([]);
  // Task mode: the latest check result, cleared by the next change.
  const [checkResult, setCheckResult] = useState('');
  const [solved, setSolved] = useState(false);
  const frequency = stringFrequency(settings);

  const verify = (state: StringSettings, nextAnswered: readonly string[]) => {
    const reached = predictions.filter((item) => nextAnswered.includes(item.id) && sameSettings(state, item.target)).map((item) => item.id);
    const nextVerified = Array.from(new Set([...verified, ...reached]));
    if (nextVerified.length === verified.length) return;
    setVerified(nextVerified);
    if (predictions.every((item) => nextVerified.includes(item.id))) onComplete();
  };

  const chooseLevel = (factor: StringFactor, index: number) => {
    const next = withFactorLevel(settings, factor, index);
    if (sameSettings(next, settings)) return;
    setSettings(next);
    setLastChanged(factor);
    setAnnouncement(frequencyChangeText(frequency, stringFrequency(next), content));
    setCheckResult('');
    verify(next, answered);
  };

  const reset = () => {
    setSettings(start);
    setLastChanged(null);
    setAnnouncement(task ? `${stringFrequency(start)} Гц — ${task.startText}` : content.resetText);
    setCheckResult('');
    verify(start, answered);
  };

  const answer = (id: string) => {
    if (answered.includes(id)) return;
    const nextAnswered = [...answered, id];
    setAnswered(nextAnswered);
    verify(settings, nextAnswered);
  };

  // A wrong direction gets the rule of the factor moved last, never a bare «неправильно».
  const check = () => {
    if (!task) return;
    if (taskSolved(task.model, settings)) {
      setCheckResult(task.solved);
      if (!solved) {
        setSolved(true);
        onComplete();
      }
      return;
    }
    const change = pitchChange(stringFrequency(start), frequency);
    setCheckResult(change === 'same' || lastChanged === null ? task.sameHint : `${task.wrongHint} ${content.rules[lastChanged]}`);
  };

  const done = completed || (task ? solved : predictions.every((item) => verified.includes(item.id)));

  return {
    titleId,
    settings,
    frequency,
    lastChanged,
    announcement,
    chooseLevel,
    reset,
    answer,
    check,
    checkStatus: checkResult || (task && done ? task.solved : ''),
    isAnswered: (id: string) => answered.includes(id),
    isVerified: (id: string) => verified.includes(id),
    done,
  };
}
