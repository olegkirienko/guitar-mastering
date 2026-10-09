import { Button } from '@/components/base/buttons/button';
import type { PairGapsProps } from '@/components/lesson/pair-gaps/types';
import { ToneSequence } from '@/components/lesson/tone-sequence/tone-sequence';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { gradePair, whitePairs } from '@/data/lessons/stage-02-lesson-03-model/utils/pairs';

const pairs = whitePairs();

export function PairGaps({ content, base, audio, gain, choices, onChoose }: PairGapsProps) {
  return <ul aria-label={content.caption} className="space-y-3">
    {pairs.map((pair, index) => {
      const chosen = choices[index];
      return <li key={pair.from} className="space-y-2 rounded-lg border border-secondary bg-primary p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium tabular-nums text-primary">{content.pairLabel(pair.from, pair.to)}</p>
          <ToneSequence
            sequences={[{ id: String(index), label: content.listenLabel, frequencies: [keyFrequency(base, pair.from), keyFrequency(base, pair.to)] }]}
            stopLabel={content.stopLabel}
            audio={audio}
            gain={gain}
          />
        </div>
        <div role="group" aria-label={content.pairLabel(pair.from, pair.to)} className="flex flex-wrap gap-3">
          {content.options.map((option) => <Button
            key={option.semitones}
            color={chosen === option.semitones ? 'primary' : 'secondary'}
            aria-pressed={chosen === option.semitones}
            onClick={() => onChoose(index, option.semitones)}
          >{option.label}</Button>)}
        </div>
        <p role="status" className="text-sm text-secondary">{chosen === undefined ? null : gradePair(pair, chosen) ? content.right : content.wrong}</p>
      </li>;
    })}
  </ul>;
}
