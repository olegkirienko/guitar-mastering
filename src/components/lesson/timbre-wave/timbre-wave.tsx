import { partialDashes, waveBox } from '@/components/lesson/timbre-wave/constants';
import type { TimbreWaveProps } from '@/components/lesson/timbre-wave/types';
import type { CurvePoint } from '@/data/lessons/stage-01-lesson-04-model/types';
import { visualRepeats, waveCurves, waveDescription } from '@/data/lessons/stage-01-lesson-04-model/utils/wave';

function toPath(points: readonly CurvePoint[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${(waveBox.left + point.x * waveBox.span).toFixed(1)} ${(waveBox.middle - point.y * waveBox.amplitude).toFixed(1)}`).join(' ');
}

// The sum over a few repeats of the fundamental, with the repeat boundaries marked:
// the shape changes with the overtones while the number of repeats stays put.
export function TimbreWave({ sound, label, words, showPartials = false }: TimbreWaveProps) {
  const { sum, partials } = waveCurves(sound);
  const repeats = visualRepeats(sound.fundamental);
  const boundaries = Array.from({ length: Math.ceil(repeats) - 1 }, (_, index) => index + 1);
  return <figure className="space-y-2">
    <figcaption className="text-sm font-medium text-primary">{label}</figcaption>
    <svg viewBox={`0 0 ${waveBox.width} ${waveBox.height}`} className="h-auto w-full max-w-md" aria-hidden="true">
      {boundaries.map((repeat) => <line
        key={repeat}
        x1={waveBox.left + repeat / repeats * waveBox.span}
        x2={waveBox.left + repeat / repeats * waveBox.span}
        y1={waveBox.middle - waveBox.amplitude}
        y2={waveBox.middle + waveBox.amplitude}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 4"
        className="text-fg-quaternary"
      />)}
      {showPartials && partials.map((partial, index) => <path
        key={partial.multiple}
        d={toPath(partial.points)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray={partialDashes[index % partialDashes.length]}
        className="text-fg-quaternary"
      />)}
      <path d={toPath(sum)} fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-tertiary" />
    </svg>
    <p className="text-sm text-secondary">{waveDescription(sound, words)}</p>
  </figure>;
}
