import { useId, useState } from 'react';
import type { TimbreLabProps } from '@/components/lesson/timbre-lab/types';
import { timbrePresets } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { AttackLevel, DecayLevel, Fundamental, OvertoneLevel, OvertoneMultiple, TimbrePresetId } from '@/data/lessons/stage-01-lesson-04-model/types';
import { withOvertone } from '@/data/lessons/stage-01-lesson-04-model/utils/sound';

export function useTimbreLab({ content, sound, start, onChange }: Pick<TimbreLabProps, 'content' | 'sound' | 'start' | 'onChange'>) {
  const titleId = useId();
  const [announcement, setAnnouncement] = useState('');
  // Every control except the pitch itself leaves the pitch where it is, so each of
  // their announcements says so with the number.
  const pitch = `${content.status.samePitch} ${sound.fundamental} Гц.`;

  const chooseLevel = (multiple: OvertoneMultiple, level: OvertoneLevel) => {
    if (sound.overtones[multiple] === level) return;
    onChange(withOvertone(sound, multiple, level));
    setAnnouncement(`${content.status.overtone} ×${multiple}: ${content.levels[level]}. ${pitch}`);
  };

  // The one control that does move the pitch, so its announcement says the new one
  // instead of repeating that nothing changed.
  const chooseFundamental = (fundamental: Fundamental) => {
    if (!content.fundamental || sound.fundamental === fundamental) return;
    onChange({ ...sound, fundamental });
    setAnnouncement(`${content.fundamental.status} ${fundamental} Гц.`);
  };

  const chooseAttack = (attack: AttackLevel) => {
    if (!content.envelope || sound.attack === attack) return;
    onChange({ ...sound, attack });
    setAnnouncement(`${content.envelope.attackLabel}: ${content.envelope.attacks[attack]}. ${pitch}`);
  };

  const chooseDecay = (decay: DecayLevel) => {
    if (!content.envelope || sound.decay === decay) return;
    onChange({ ...sound, decay });
    setAnnouncement(`${content.envelope.decayLabel}: ${content.envelope.decays[decay]}. ${pitch}`);
  };

  // A preset changes the overtones and the two ends of the sound, never the pitch.
  const choosePreset = (id: TimbrePresetId, label: string) => {
    if (!content.presets) return;
    onChange({ ...timbrePresets[id], fundamental: sound.fundamental });
    setAnnouncement(`${content.presets.status.preset} ${label}. ${pitch}`);
  };

  const reset = () => {
    if (!content.presets) return;
    onChange(start);
    setAnnouncement(`${content.presets.status.reset} ${pitch}`);
  };

  return { titleId, announcement, chooseLevel, chooseFundamental, chooseAttack, chooseDecay, choosePreset, reset };
}
