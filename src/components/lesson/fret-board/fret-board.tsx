import { boardHeight, boardWidth, halfStringWidth, nutX, stringY } from '@/components/lesson/fret-board/constants';
import { useFretBoard } from '@/components/lesson/fret-board/hooks/use-fret-board';
import type { FretBoardProps } from '@/components/lesson/fret-board/types';
import { fretX, lengthFractionText, pressX } from '@/components/lesson/fret-board/utils/geometry';
import { lastFret } from '@/data/lessons/stage-03-lesson-01-model/constants';
import { fretLengthFraction } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';
import { cx } from '@/utils/cx';

export function FretBoard({ content, selected, selectable = [], onSelect, describe, showLength = false }: FretBoardProps) {
  const { buttons, onKeyDown } = useFretBoard(selectable, onSelect);
  const frets = Array.from({ length: lastFret + 1 }, (_, fret) => fret);
  const pressed = selected ?? 0;
  const stringEnd = nutX + halfStringWidth * 2;
  return <div className="space-y-3">
    <svg role="img" aria-label={content.label} viewBox={`0 0 ${boardWidth} ${boardHeight}`} className="h-auto w-full text-tertiary">
      <rect x={nutX - 4} y={stringY - 28} width={6} height={56} className="fill-current text-primary" />
      {frets.slice(1).map((fret) => <g key={fret}>
        <line x1={fretX(fret)} x2={fretX(fret)} y1={stringY - 26} y2={stringY + 26} stroke="currentColor" strokeWidth={2} />
        <text x={fretX(fret)} y={stringY + 46} textAnchor="middle" fontSize={16} className="fill-current">{fret}</text>
      </g>)}
      <text x={nutX} y={stringY + 46} textAnchor="middle" fontSize={16} className="fill-current">0</text>
      <line x1={nutX} x2={stringEnd} y1={stringY} y2={stringY} stroke="currentColor" strokeWidth={3} strokeDasharray="6 5" opacity={0.5} />
      <line x1={selected === null ? nutX : fretX(pressed)} x2={stringEnd} y1={stringY} y2={stringY} className="stroke-utility-brand-600" strokeWidth={4} />
      {selected !== null && <circle cx={pressX(pressed)} cy={stringY} r={11} className="fill-utility-brand-600 stroke-white" strokeWidth={2} />}
    </svg>
    {selectable.length > 0 && <div role="group" aria-label={content.picker} className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1">
      {frets.map((fret) => {
        const enabled = selectable.includes(fret);
        return <button
          key={fret}
          ref={(node) => { buttons.current[fret] = node; }}
          type="button"
          disabled={!enabled}
          aria-pressed={selected === fret}
          aria-label={describe(fret)}
          onClick={() => onSelect?.(fret)}
          onKeyDown={(event) => onKeyDown(event, fret)}
          className={cx(
            'min-h-11 min-w-11 rounded-md border text-sm font-semibold tabular-nums outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40',
            selected === fret ? 'border-utility-brand-600 bg-utility-brand-600 text-white' : 'border-secondary bg-primary text-primary',
          )}
        >{fret}</button>;
      })}
    </div>}
    {selected !== null && <p role="status" className="text-sm font-medium text-primary">{content.selected(selected)}</p>}
    {showLength && <div className="space-y-1">
      <p className="text-sm text-secondary">{content.lengthTitle}: <span className="font-medium tabular-nums text-primary">{content.lengthText(lengthFractionText(pressed))}</span></p>
      <div className="h-3 w-full rounded-full bg-secondary" aria-hidden="true">
        <div className="h-3 rounded-full bg-utility-brand-600" style={{ width: `${fretLengthFraction(pressed) * 100}%` }} />
      </div>
    </div>}
  </div>;
}
