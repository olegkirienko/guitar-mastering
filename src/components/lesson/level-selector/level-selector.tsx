import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from 'react-aria-components';
import type { LevelSelectorProps } from '@/components/lesson/level-selector/types';
import { cx } from '@/utils/cx';

// One named factor as a single-choice row that still fits three levels on one line
// at 320 px. Untitled UI's `RadioButton` spends that width on its dot and its
// `ButtonGroup` moves focus with the arrow keys without selecting, so the levels are
// chips over the same React Aria radio group both are built on: arrow keys change
// the level, and only the chosen chip is in the tab order.
export function LevelSelector<Level extends string>({ label, levels, value, onChange }: LevelSelectorProps<Level>) {
  return <AriaRadioGroup
    aria-label={label}
    value={value}
    onChange={(next) => onChange(next as Level)}
    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
  >
    <p className="text-sm font-medium text-primary">{label}</p>
    <div className="flex items-center gap-1">
      {levels.map((level) => <AriaRadio
        key={level.id}
        value={level.id}
        className={({ isSelected, isFocusVisible }) => cx(
          'flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-xs font-medium ring-1 transition duration-100 ease-linear ring-inset select-none sm:px-3 sm:text-sm',
          isSelected ? 'bg-brand-solid text-white ring-transparent' : 'bg-primary text-secondary ring-primary hover:bg-primary_hover',
          isFocusVisible && 'outline-2 outline-offset-2 outline-focus-ring',
        )}
      >{level.label}</AriaRadio>)}
    </div>
  </AriaRadioGroup>;
}
