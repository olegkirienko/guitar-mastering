import { useId } from 'react';
import { LevelSelector } from '@/components/lesson/level-selector/level-selector';
import type { EnvelopeControlsProps } from '@/components/lesson/timbre-lab/components/envelope-controls/types';
import { attackLevels, decayLevels } from '@/data/lessons/stage-01-lesson-04-model/constants';

// The two ends of the sound in time, each as its own single-choice row — the same
// kind of row the overtones use, so the whole lab is operated the same way.
export function EnvelopeControls({ content, sound, onAttack, onDecay }: EnvelopeControlsProps) {
  const titleId = useId();
  return <section aria-labelledby={titleId} className="space-y-3">
    <div>
      <h4 id={titleId} className="font-semibold text-primary">{content.title}</h4>
      <p className="mt-1 text-sm text-tertiary">{content.note}</p>
    </div>
    <ul className="space-y-3">
      <li>
        <LevelSelector
          label={content.attackLabel}
          levels={attackLevels.map((level) => ({ id: level, label: content.attacks[level] }))}
          value={sound.attack}
          onChange={onAttack}
        />
      </li>
      <li>
        <LevelSelector
          label={content.decayLabel}
          levels={decayLevels.map((level) => ({ id: level, label: content.decays[level] }))}
          value={sound.decay}
          onChange={onDecay}
        />
      </li>
    </ul>
  </section>;
}
