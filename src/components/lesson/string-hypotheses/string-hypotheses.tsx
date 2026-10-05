import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import type { StringHypothesesProps } from '@/components/lesson/string-hypotheses/types';

// Screen `intro`: the learner's own guesses, never graded here.
export function StringHypotheses({ content, selected, onToggle, own, onOwnChange }: StringHypothesesProps) {
  return <fieldset className="space-y-4">
    <legend className="text-lg font-semibold text-primary">{content.hypothesesLabel}</legend>
    <p className="text-sm text-tertiary">{content.invitation}</p>
    <div className="grid gap-2 sm:grid-cols-2">
      {content.hypotheses.map((hypothesis) => <Checkbox
        key={hypothesis.id}
        size="md"
        className="min-h-11 rounded-lg border border-secondary p-3"
        label={hypothesis.label}
        isSelected={selected.includes(hypothesis.id)}
        onChange={(isSelected) => onToggle(hypothesis.id, isSelected)}
      />)}
    </div>
    {selected.includes('own') && <Input label={content.ownLabel} maxLength={120} value={own} onChange={onOwnChange} />}
    {selected.includes('force') && <p className="rounded-lg bg-secondary p-4 text-sm leading-6 text-secondary">{content.forceNote}</p>}
    <p className="text-sm font-medium text-primary">{content.feedback}</p>
  </fieldset>;
}
