import { useId } from 'react';
import { modeBox } from '@/components/lesson/string-modes-diagram/constants';
import type { StringModesDiagramProps } from '@/components/lesson/string-modes-diagram/types';

// The two extremes the string swings between, for one way of swinging at a time.
function envelope(parts: number, sign: number): string {
  const segment = (modeBox.bridge - modeBox.nut) / parts;
  let path = `M${modeBox.nut} ${modeBox.middle}`;
  for (let part = 0; part < parts; part += 1) {
    const from = modeBox.nut + part * segment;
    const direction = part % 2 === 0 ? sign : -sign;
    path += ` Q${(from + segment / 2).toFixed(1)} ${modeBox.middle - direction * modeBox.bulge * 2} ${(from + segment).toFixed(1)} ${modeBox.middle}`;
  }
  return path;
}

// The ways one string swings at the same time: whole, in halves, in thirds. Static —
// each drawing is decorative and the row's own text says what it shows.
export function StringModesDiagram({ content }: StringModesDiagramProps) {
  const titleId = useId();
  return <section aria-labelledby={titleId} className="space-y-4 rounded-lg border border-secondary bg-primary p-5">
    <div>
      <h3 id={titleId} className="font-semibold text-primary">{content.title}</h3>
      <p className="mt-1 text-sm leading-6 text-secondary">{content.note}</p>
    </div>
    <ul className="space-y-4">
      {content.rows.map((row) => {
        const segment = (modeBox.bridge - modeBox.nut) / row.parts;
        const nodes = Array.from({ length: row.parts + 1 }, (_, index) => modeBox.nut + index * segment);
        return <li key={row.id} className="space-y-1">
          <p className="text-sm font-medium text-primary">{row.label}</p>
          <svg viewBox={`0 0 ${modeBox.width} ${modeBox.height}`} className="h-auto w-full max-w-md" aria-hidden="true">
            <g className="text-fg-tertiary">
              <line x1={modeBox.nut} y1="8" x2={modeBox.nut} y2="48" stroke="currentColor" strokeWidth="4" />
              <line x1={modeBox.bridge} y1="8" x2={modeBox.bridge} y2="48" stroke="currentColor" strokeWidth="4" />
            </g>
            <line x1={modeBox.nut} y1={modeBox.middle} x2={modeBox.bridge} y2={modeBox.middle} stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" className="text-fg-quaternary" />
            {[1, -1].map((sign) => <path key={sign} d={envelope(row.parts, sign)} fill="none" stroke="currentColor" strokeWidth="2" className="text-fg-brand-primary" />)}
            {nodes.map((x) => <circle key={x} cx={x.toFixed(1)} cy={modeBox.middle} r="4" fill="currentColor" className="text-fg-primary" />)}
          </svg>
          <p className="text-sm leading-6 text-secondary">{row.description}</p>
        </li>;
      })}
    </ul>
  </section>;
}
