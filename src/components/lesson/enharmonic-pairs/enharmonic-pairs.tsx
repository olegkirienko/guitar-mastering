import { Button } from '@/components/base/buttons/button';
import { useEnharmonicPairs } from '@/components/lesson/enharmonic-pairs/hooks/use-enharmonic-pairs';
import type { EnharmonicPairsProps } from '@/components/lesson/enharmonic-pairs/types';
import { SignedName } from '@/components/lesson/signed-name/signed-name';
import { areEnharmonic } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

export function EnharmonicPairs({ content, left, right, onSolved }: EnharmonicPairsProps) {
  const { selected, matched, status, done, chooseLeft, chooseRight } = useEnharmonicPairs({ content, left, onSolved });
  const rightMatched = (name: string) => matched.some((first) => areEnharmonic(first, name));
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4">
      <div role="group" aria-label={`${content.caption}: ${content.leftTitle}`} className="space-y-2">
        <h4 className="text-sm font-semibold text-primary">{content.leftTitle}</h4>
        {left.map((name) => <Button key={name} size="lg" className="w-full" color={selected === name || matched.includes(name) ? 'primary' : 'secondary'} aria-pressed={selected === name} isDisabled={matched.includes(name)} onClick={() => chooseLeft(name)}><SignedName name={name} /></Button>)}
      </div>
      <div role="group" aria-label={`${content.caption}: ${content.rightTitle}`} className="space-y-2">
        <h4 className="text-sm font-semibold text-primary">{content.rightTitle}</h4>
        {right.map((name) => <Button key={name} size="lg" className="w-full" color={rightMatched(name) ? 'primary' : 'secondary'} isDisabled={rightMatched(name) || selected === null} onClick={() => chooseRight(name)}><SignedName name={name} /></Button>)}
      </div>
    </div>
    <p role="status" className="text-sm text-secondary">{done ? content.done : status}</p>
  </div>;
}
