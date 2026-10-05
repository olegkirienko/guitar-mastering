import { useState } from 'react';
import type { StringFactorExperimentProps } from '@/components/lesson/string-factor-experiment/types';
import { levelsToComplete } from '@/components/lesson/string-factor-experiment/constants';
import { defaultStringSettings } from '@/data/lessons/stage-01-lesson-03-model/constants';
import { frequencyChangeText } from '@/data/lessons/stage-01-lesson-03-model/utils/change';
import { factorLevelIndex, factorLevels, stringFrequency, withFactorLevel } from '@/data/lessons/stage-01-lesson-03-model/utils/frequency';

export function useStringFactorExperiment({ factor, content, completed, onComplete }: Pick<StringFactorExperimentProps, 'factor' | 'content' | 'completed' | 'onComplete'>) {
  const [predicted, setPredicted] = useState(false);
  const [settings, setSettings] = useState(defaultStringSettings);
  const [tried, setTried] = useState<readonly number[]>([factorLevelIndex(defaultStringSettings, factor)]);
  const [announcement, setAnnouncement] = useState('');
  const frequency = stringFrequency(settings);
  const levelIndex = factorLevelIndex(settings, factor);
  const done = predicted && tried.length >= levelsToComplete;

  const chooseLevel = (index: number) => {
    if (index === levelIndex) return;
    const next = withFactorLevel(settings, factor, index);
    const nextTried = tried.includes(index) ? tried : [...tried, index];
    setSettings(next);
    setTried(nextTried);
    setAnnouncement(frequencyChangeText(frequency, stringFrequency(next), content));
    if (predicted && nextTried.length >= levelsToComplete) onComplete();
  };

  const observations = factorLevels(factor).map((_, index) => ({
    index,
    frequency: tried.includes(index) ? stringFrequency(withFactorLevel(settings, factor, index)) : null,
  }));

  return {
    settings,
    frequency,
    levelIndex,
    announcement,
    observations,
    predict: () => setPredicted(true),
    chooseLevel,
    showExperiment: predicted || completed,
    showNaming: done || completed,
    needsMoreLevels: predicted && !done && !completed,
  };
}
