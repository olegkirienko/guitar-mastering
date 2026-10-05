import { useState } from 'react';
import type { StringFrequencyLabProps } from '@/components/lesson/string-frequency-lab/types';
import { defaultStringSettings } from '@/data/lessons/stage-01-lesson-03-model/constants';
import type { StringFactor, StringSettings } from '@/data/lessons/stage-01-lesson-03-model/types';
import { frequencyChangeText } from '@/data/lessons/stage-01-lesson-03-model/utils/change';
import { sameSettings, stringFrequency, withFactorLevel } from '@/data/lessons/stage-01-lesson-03-model/utils/frequency';

export function useStringFrequencyLab({ content, predictions, completed, onComplete }: Pick<StringFrequencyLabProps, 'content' | 'predictions' | 'completed' | 'onComplete'>) {
  const [settings, setSettings] = useState(defaultStringSettings);
  const [lastChanged, setLastChanged] = useState<StringFactor | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // A prediction counts as tested only when its state is reached after the guess.
  const [answered, setAnswered] = useState<readonly string[]>([]);
  const [verified, setVerified] = useState<readonly string[]>([]);
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
    verify(next, answered);
  };

  const reset = () => {
    setSettings(defaultStringSettings);
    setLastChanged(null);
    setAnnouncement(content.resetText);
    verify(defaultStringSettings, answered);
  };

  const answer = (id: string) => {
    if (answered.includes(id)) return;
    const nextAnswered = [...answered, id];
    setAnswered(nextAnswered);
    verify(settings, nextAnswered);
  };

  return {
    settings,
    frequency,
    lastChanged,
    announcement,
    chooseLevel,
    reset,
    answer,
    isAnswered: (id: string) => answered.includes(id),
    isVerified: (id: string) => verified.includes(id),
    done: completed || predictions.every((item) => verified.includes(item.id)),
  };
}
