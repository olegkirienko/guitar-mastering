import { halfStringWidth, mapHeight, mapWidth, nutX } from '@/components/lesson/string-map/constants';
import type { StringMapProps } from '@/components/lesson/string-map/types';
import { fretX, pressX, stringWidth, stringY } from '@/components/lesson/string-map/utils/geometry';
import { openStrings } from '@/data/lessons/stage-03-lesson-02-model/constants';
import { cx } from '@/utils/cx';

const frets = Array.from({ length: 12 }, (_, index) => index + 1);
// Buttons run from the thickest string (6) to the thinnest (1), matching the picture from the bottom.
const stringNumbers = [...openStrings].map((item) => item.number).reverse();

export function StringMap({ content, revealed, selected = null, highlighted = [], pressed = null, onSelectString, selectableFrets = [], fret = 0, onSelectFret, describeString, describeFret }: StringMapProps) {
  const end = nutX + halfStringWidth * 2;
  return <div className="space-y-3">
    <svg role="img" aria-label={content.label} viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="h-auto w-full text-tertiary">
      <rect x={nutX - 4} y={stringY(1) - 12} width={6} height={stringY(6) - stringY(1) + 24} className="fill-current text-primary" />
      {frets.map((number) => <line key={number} x1={fretX(number)} x2={fretX(number)} y1={stringY(1) - 12} y2={stringY(6) + 12} stroke="currentColor" strokeWidth={1} opacity={0.6} />)}
      {openStrings.map((item) => {
        const emphasised = highlighted.includes(item.number) || selected === item.number;
        const start = pressed?.string === item.number && pressed.fret > 0 ? fretX(pressed.fret) : nutX;
        return <g key={item.number}>
          <text x={nutX - 14} y={stringY(item.number) + 5} textAnchor="end" fontSize={14} className="fill-current">{item.number}</text>
          <line x1={nutX} x2={end} y1={stringY(item.number)} y2={stringY(item.number)} stroke="currentColor" strokeWidth={stringWidth(item.number)} opacity={0.5} />
          {emphasised && <line x1={start} x2={end} y1={stringY(item.number)} y2={stringY(item.number)} className="stroke-utility-brand-600" strokeWidth={stringWidth(item.number) + 1.5} />}
          {revealed.includes(item.number) && <text x={end + 8} y={stringY(item.number) + 5} fontSize={14} fontWeight={600} className="fill-current text-primary">{item.openNote}</text>}
        </g>;
      })}
      {pressed && pressed.fret > 0 && <circle cx={pressX(pressed.fret)} cy={stringY(pressed.string)} r={9} className="fill-utility-brand-600 stroke-white" strokeWidth={2} />}
    </svg>
    {onSelectString && <div role="group" aria-label={content.stringButtons} className="grid grid-cols-6 gap-1">
      {stringNumbers.map((number) => <button
        key={number}
        type="button"
        aria-pressed={selected === number}
        aria-label={describeString(number)}
        onClick={() => onSelectString(number)}
        className={cx(
          'min-h-11 min-w-11 rounded-md border text-sm font-semibold tabular-nums outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2',
          selected === number ? 'border-utility-brand-600 bg-utility-brand-600 text-white' : 'border-secondary bg-primary text-primary',
        )}
      >{number}</button>)}
    </div>}
    {selectableFrets.length > 0 && <div role="group" aria-label={content.fretPicker} className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1">
      {selectableFrets.map((item) => <button
        key={item}
        type="button"
        aria-pressed={fret === item}
        aria-label={describeFret(item)}
        onClick={() => onSelectFret?.(item)}
        className={cx(
          'min-h-11 min-w-11 rounded-md border text-sm font-semibold tabular-nums outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2',
          fret === item ? 'border-utility-brand-600 bg-utility-brand-600 text-white' : 'border-secondary bg-primary text-primary',
        )}
      >{item}</button>)}
    </div>}
  </div>;
}
