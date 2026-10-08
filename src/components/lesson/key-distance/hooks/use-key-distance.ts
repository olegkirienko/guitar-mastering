import { useState } from 'react';
import type { KeyDistanceProps } from '@/components/lesson/key-distance/types';
import { baseFrequency } from '@/data/lessons/stage-02-lesson-02-model/constants';
import { keyFrequency, semitoneDistance } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';

// Keeps the last two keys pressed; the distance is shown once there are two.
export function useKeyDistance({ audio, gain }: Pick<KeyDistanceProps, 'audio' | 'gain'>) {
  const [pressed, setPressed] = useState<readonly number[]>([]);

  const press = (key: number) => {
    audio.playTone(keyFrequency(baseFrequency, key), gain);
    setPressed((current) => [...current, key].slice(-2));
  };

  const distance = pressed.length === 2 ? semitoneDistance(pressed[0], pressed[1]) : null;
  return { pressed, distance, press };
}
