import { envelopeBox } from '@/components/lesson/envelope-curve/constants';
import type { EnvelopeCurveProps } from '@/components/lesson/envelope-curve/types';
import { maxSoundDuration } from '@/data/lessons/stage-01-lesson-04-model/constants';
import { envelopeDescription, envelopePoints, soundDuration } from '@/data/lessons/stage-01-lesson-04-model/utils/envelope';

// How loud the sound is over time: the rise at the start and the fall at the end.
// Static and decorative — the sentence under it carries the same two facts in words.
export function EnvelopeCurve({ sound, label, words }: EnvelopeCurveProps) {
  const plotHeight = envelopeBox.baseline - envelopeBox.top;
  const width = envelopeBox.span * soundDuration(sound) / maxSoundDuration;
  const path = envelopePoints(sound)
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${(envelopeBox.left + point.x * width).toFixed(1)} ${(envelopeBox.baseline - point.y * plotHeight).toFixed(1)}`)
    .join(' ');
  return <figure className="space-y-2">
    <figcaption className="text-sm font-medium text-primary">{label}</figcaption>
    <svg viewBox={`0 0 ${envelopeBox.width} ${envelopeBox.height}`} className="h-auto w-full max-w-md" aria-hidden="true">
      <line x1="0" y1={envelopeBox.baseline} x2={envelopeBox.width} y2={envelopeBox.baseline} stroke="currentColor" strokeWidth="1" className="text-fg-quaternary" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-tertiary" />
      {/* Where the sound ends: everything to the right of it is silence. */}
      <line
        x1={envelopeBox.left + width}
        x2={envelopeBox.left + width}
        y1={envelopeBox.top}
        y2={envelopeBox.baseline}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 4"
        className="text-fg-quaternary"
      />
    </svg>
    <p className="text-sm text-secondary">{envelopeDescription(sound, words)}</p>
  </figure>;
}
