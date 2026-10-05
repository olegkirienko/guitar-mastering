import { useId } from 'react';
import { LevelSelector } from '@/components/lesson/level-selector/level-selector';
import type { OvertoneMixerProps } from '@/components/lesson/overtone-mixer/types';
import { partialLabel } from '@/data/lessons/stage-01-lesson-04-model/utils/sound';

// A wave that cannot be changed on this screen: shown with the level it is at, so the
// mix stays part of the picture. There is no control to disable — the section's own
// note says why this one is fixed.
function FixedRow({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
    <p className="text-sm font-medium text-primary">{label}</p>
    <p className="text-sm text-tertiary">{value}</p>
  </div>;
}

// The overtones of one sound, each as its own level group. The fundamental keeps
// the first row so it stays part of the picture, but it has no control: it always sounds.
export function OvertoneMixer({ content, multiples, levels, sound, onChange }: OvertoneMixerProps) {
  const titleId = useId();
  return <section aria-labelledby={titleId} className="space-y-3">
    <div>
      <h4 id={titleId} className="font-semibold text-primary">{content.title}</h4>
      <p className="mt-1 text-sm text-tertiary">{content.note}</p>
    </div>
    <ul className="space-y-3">
      <li className="border-b border-secondary pb-3">
        <FixedRow label={partialLabel(sound.fundamental, 1)} value={content.fundamentalNote} />
      </li>
      {multiples.map((multiple) => <li key={multiple}>
        {onChange
          ? <LevelSelector
            label={partialLabel(sound.fundamental, multiple)}
            levels={levels}
            value={sound.overtones[multiple]}
            onChange={(level) => onChange(multiple, level)}
          />
          : <FixedRow label={partialLabel(sound.fundamental, multiple)} value={levels.find((level) => level.id === sound.overtones[multiple])?.label ?? ''} />}
      </li>)}
    </ul>
  </section>;
}
