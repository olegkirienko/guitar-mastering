import type { PitchLoudnessComparisonProps } from '@/components/lesson/pitch-loudness-comparison/types';
import { loudnessGain } from '@/data/lessons/stage-01-lesson-02-model/constants';
import { useState } from 'react';

export function usePitchLoudnessComparison({ content }: Pick<PitchLoudnessComparisonProps, 'content'>) {
  const [answered, setAnswered] = useState(false);
  const examples = [
    { id: 'quiet', label: content.quietLabel, listen: content.listenQuiet, gain: loudnessGain.quiet },
    { id: 'loud', label: content.loudLabel, listen: content.listenLoud, gain: loudnessGain.loud },
  ] as const;

  return { answered, setAnswered, examples };
}
