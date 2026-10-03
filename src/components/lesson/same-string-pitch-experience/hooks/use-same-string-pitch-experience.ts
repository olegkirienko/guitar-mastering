import type { SameStringPitchExperienceProps } from '@/components/lesson/same-string-pitch-experience/types';
import { stringPluckFrequency } from '@/data/lessons/stage-01-lesson-02-model/constants';
import { useState } from 'react';

export function useSameStringPitchExperience({ audio, onReady }: Pick<SameStringPitchExperienceProps, 'audio' | 'onReady'>) {
  const [openPlucked, setOpenPlucked] = useState(false);
  const [pressedPlucked, setPressedPlucked] = useState(false);

  // With audio on, the same buttons also play short, non-overlapping plucks.
  const pluckOpen = () => {
    setOpenPlucked(true);
    if (audio?.enabled) audio.playPluck(stringPluckFrequency.open);
  };
  const pluckPressed = () => {
    setPressedPlucked(true);
    if (audio?.enabled) audio.playPluck(stringPluckFrequency.pressed);
    onReady();
  };

  return { openPlucked, pressedPlucked, pluckOpen, pluckPressed };
}
