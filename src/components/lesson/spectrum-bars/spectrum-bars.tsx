import { useId } from 'react';
import { barRadius, emptyBarHeight, spectrumBox } from '@/components/lesson/spectrum-bars/constants';
import type { SpectrumBarsProps } from '@/components/lesson/spectrum-bars/types';
import { overtoneMultiples, overtoneStrengths } from '@/data/lessons/stage-01-lesson-04-model/constants';

// Which frequencies are in the sound and how strong each one is. The bars are
// decorative and only the multiple is written under them — text inside the drawing
// would shrink with it — while the table carries all three numbers of every partial.
export function SpectrumBars({ content, sound }: SpectrumBarsProps) {
  const titleId = useId();
  const rows = [
    { multiple: 1, strength: 1, level: content.fundamentalStrength },
    ...overtoneMultiples.map((multiple) => ({ multiple, strength: overtoneStrengths[sound.overtones[multiple]], level: content.levels[sound.overtones[multiple]] })),
  ];
  const plotHeight = spectrumBox.baseline - spectrumBox.top;
  return <section aria-labelledby={titleId} className="space-y-3">
    <div>
      <h4 id={titleId} className="font-semibold text-primary">{content.title}</h4>
      <p className="mt-1 text-sm text-tertiary">{content.note}</p>
    </div>
    <div className="w-full max-w-md">
      <svg viewBox={`0 0 ${spectrumBox.width} ${spectrumBox.height}`} className="h-auto w-full" aria-hidden="true">
        <line x1="0" y1={spectrumBox.baseline} x2={spectrumBox.width} y2={spectrumBox.baseline} stroke="currentColor" strokeWidth="1" className="text-fg-quaternary" />
        {rows.map((row, index) => {
          const height = Math.max(row.strength * plotHeight, emptyBarHeight);
          return <rect
            key={row.multiple}
            x={index * spectrumBox.slot + (spectrumBox.slot - spectrumBox.bar) / 2}
            y={spectrumBox.baseline - height}
            width={spectrumBox.bar}
            height={height}
            rx={barRadius}
            fill="currentColor"
            className={row.strength > 0 ? 'text-fg-brand-primary' : 'text-fg-quaternary'}
          />;
        })}
      </svg>
      <div aria-hidden="true" className="grid grid-cols-5 text-center text-xs font-medium text-secondary">
        {rows.map((row) => <span key={row.multiple}>×{row.multiple}</span>)}
      </div>
    </div>
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-tertiary">
          <th scope="col" className="py-1 pr-3 font-medium">{content.multipleColumn}</th>
          <th scope="col" className="py-1 pr-3 font-medium">{content.frequencyColumn}</th>
          <th scope="col" className="py-1 font-medium">{content.strengthColumn}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={row.multiple} className="border-t border-secondary">
          <th scope="row" className="py-1 pr-3 font-medium text-primary">×{row.multiple}</th>
          <td className="py-1 pr-3 whitespace-nowrap text-secondary">{row.multiple * sound.fundamental} Гц</td>
          <td className="py-1 text-secondary">{row.level}</td>
        </tr>)}
      </tbody>
    </table>
  </section>;
}
