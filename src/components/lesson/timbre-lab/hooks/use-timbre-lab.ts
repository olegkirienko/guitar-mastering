import { useId, useState } from 'react';
import type { TimbreLabProps } from '@/components/lesson/timbre-lab/types';
import { timbrePresets } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { OvertoneLevel, OvertoneMultiple, TimbrePresetId } from '@/data/lessons/stage-01-lesson-04-model/types';
import { withOvertone } from '@/data/lessons/stage-01-lesson-04-model/utils/sound';

export function useTimbreLab({ content, sound, start, onChange }: Pick<TimbreLabProps, 'content' | 'sound' | 'start' | 'onChange'>) {
  const titleId = useId();
  const [announcement, setAnnouncement] = useState('');
  // Nothing here can change the pitch, so every announcement says so with the number.
  const pitch = `${content.status.samePitch} ${sound.fundamental} Гц.`;

  const chooseLevel = (multiple: OvertoneMultiple, level: OvertoneLevel) => {
    if (sound.overtones[multiple] === level) return;
    onChange(withOvertone(sound, multiple, level));
    setAnnouncement(`${content.status.overtone} ×${multiple}: ${content.levels[level]}. ${pitch}`);
  };

  // A preset changes the overtones and the two ends of the sound, never the pitch.
  const choosePreset = (id: TimbrePresetId, label: string) => {
    onChange({ ...timbrePresets[id], fundamental: sound.fundamental });
    setAnnouncement(`${content.status.preset} ${label}. ${pitch}`);
  };

  const reset = () => {
    onChange(start);
    setAnnouncement(`${content.status.reset} ${pitch}`);
  };

  return { titleId, announcement, chooseLevel, choosePreset, reset };
}
