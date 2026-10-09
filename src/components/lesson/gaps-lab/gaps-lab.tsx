import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { useGapsLab } from '@/components/lesson/gaps-lab/hooks/use-gaps-lab';
import type { GapsLabProps } from '@/components/lesson/gaps-lab/types';
import { pairNames, pairs } from '@/components/lesson/gaps-lab/utils/grading';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { baseFrequency, blackKeyPositions, lastKeyNumber } from '@/data/lessons/stage-02-lesson-03-model/constants';
import { isWhiteKey } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { namesOfKey, spokenName } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

export function GapsLab({ content, keys, audio, gain, onSolved }: GapsLabProps) {
  const { picked, toggle, verdict, check, found, explain, explained } = useGapsLab({ onSolved });
  return <div className="space-y-6">
    <KeyRow
      label={keys.keyRowLabel}
      count={lastKeyNumber + 1}
      base={baseFrequency}
      keyLabel={(key, frequency) => keys.keyLabel(key, isWhiteKey(key) ? keys.colors.white : keys.colors.black, frequency, namesOfKey(key % 12).map(spokenName))}
      onPlay={(key) => audio.playTone(keyFrequency(baseFrequency, key), gain)}
      narrowKeys={blackKeyPositions}
    />
    <div role="group" aria-label={content.instruction} className="flex flex-wrap gap-3">
      {pairs.map((_, index) => {
        const [from, to] = pairNames(index);
        return <Button key={index} color={picked.includes(index) ? 'primary' : 'secondary'} aria-pressed={picked.includes(index)} isDisabled={found} onClick={() => toggle(index)}>
          {content.pairLabel(from, to)}
        </Button>;
      })}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Button size="lg" isDisabled={found} onClick={check}>{content.checkLabel}</Button>
      <p role="status" className="text-sm text-secondary">{verdict === 'right' ? content.right : verdict === 'wrong' ? content.wrong : null}</p>
    </div>
    {found && <ChoiceQuestion question={content.explain.question} choices={content.explain.choices} correctChoiceId={content.explain.correctChoiceId} onCheck={explain} />}
    {found && explained && <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{content.recall}</p>}
  </div>;
}
