import { narrowKeys as defaultNarrowKeys } from '@/components/lesson/key-row/constants';
import { useKeyRow } from '@/components/lesson/key-row/hooks/use-key-row';
import type { KeyRowProps } from '@/components/lesson/key-row/types';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { cx } from '@/utils/cx';

export function KeyRow({ label, count, base, keyLabel, onPlay, highlighted = [], narrowKeys = defaultNarrowKeys, captions = {}, trail = [] }: KeyRowProps) {
  const { buttons, onKeyDown } = useKeyRow(count);
  return <div role="group" aria-label={label} className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1 sm:grid-cols-13">
    {Array.from({ length: count }, (_, key) => {
      const narrow = narrowKeys.includes(key);
      return <button
        key={key}
        ref={(node) => { buttons.current[key] = node; }}
        type="button"
        aria-label={keyLabel(key, keyFrequency(base, key).toFixed(1).replace('.', ','))}
        onClick={() => onPlay(key)}
        onKeyDown={(event) => onKeyDown(event, key)}
        className={cx(
          'flex min-h-11 flex-col items-center justify-end rounded-md border pb-2 text-sm font-semibold tabular-nums outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2',
          narrow ? 'h-20 border-gray-900 bg-gray-800 text-white' : 'h-28 border-secondary bg-primary text-primary',
          trail.includes(key) && 'border-dashed border-utility-brand-600',
          highlighted.includes(key) && 'border-utility-brand-600 bg-utility-brand-600 text-white',
        )}
      >{captions[key]?.split('\n').map((line) => <span key={line}>{line}</span>)}<span>{key}</span></button>;
    })}
  </div>;
}
