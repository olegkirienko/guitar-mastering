import { Button } from '@/components/base/buttons/button';
import { EnvelopeCurve } from '@/components/lesson/envelope-curve/envelope-curve';
import type { TimbreSoundComparisonProps } from '@/components/lesson/timbre-sound-comparison/types';
import { playbackGain } from '@/data/lessons/stage-01-lesson-04-model/constants';
import { toPartialsSound } from '@/data/lessons/stage-01-lesson-04-model/utils/partials';
import { useId } from 'react';

// Named sounds of one frequency: the descriptions carry the same observation when
// there is no audio, so nothing here is only hearable. The columns follow the number
// of sounds, so two of them fill the row just as three do.
export function TimbreSoundComparison({ content, audio, curve }: TimbreSoundComparisonProps) {
  const titleId = useId();
  return <section aria-labelledby={titleId} className="rounded-lg border border-secondary bg-primary p-5">
    <h3 id={titleId} className="font-semibold text-primary">{content.caption}</h3>
    <p className="mt-1 text-sm text-tertiary">{content.frequencyLabel}</p>
    <ul className="mt-4 grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
      {content.sounds.map((item) => <li key={item.id} className="space-y-2 rounded-lg border border-secondary p-4">
        <p className="font-medium text-primary">{item.label}</p>
        <p className="text-sm leading-6 text-secondary">{item.description}</p>
        {curve && <EnvelopeCurve sound={item.sound} label={curve.label} words={curve.words} />}
        {audio.enabled && <Button color="secondary" size="md" className="min-h-11" onClick={() => audio.playPartials(toPartialsSound(item.sound), playbackGain)}>{content.listenLabel}</Button>}
      </li>)}
    </ul>
  </section>;
}
