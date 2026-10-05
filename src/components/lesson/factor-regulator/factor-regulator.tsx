import { Text as AriaText } from 'react-aria-components';
import { Label } from '@/components/base/input/label';
import { RadioButton, RadioGroup } from '@/components/base/radio-buttons/radio-buttons';

// One factor as named levels; a locked factor stays visible with the reason it does not change.
export function FactorRegulator({ label, levels, value, lockedNote, onChange }: {
  label: string;
  levels: readonly string[];
  value: number;
  lockedNote?: string;
  onChange: (index: number) => void;
}) {
  return <RadioGroup
    size="md"
    value={String(value)}
    isDisabled={lockedNote !== undefined}
    onChange={(next) => onChange(Number(next))}
    className="gap-2"
  >
    <Label className="text-md font-semibold text-primary">{label}</Label>
    {lockedNote !== undefined && <AriaText slot="description" className="text-sm text-tertiary">{lockedNote}</AriaText>}
    <div className="grid gap-2 sm:grid-cols-3">
      {levels.map((level, index) => <RadioButton
        key={level}
        value={String(index)}
        label={level}
        className="min-h-11 items-center rounded-lg border border-secondary px-3 py-2"
      />)}
    </div>
  </RadioGroup>;
}
