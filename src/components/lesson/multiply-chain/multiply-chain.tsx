import { Button } from '@/components/base/buttons/button';
import type { MultiplyChainProps } from '@/components/lesson/multiply-chain/types';
import { keysInOctave } from '@/data/lessons/stage-02-lesson-02-model/constants';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';

const hertz = (value: number) => value.toFixed(1).replace('.', ',');

export function MultiplyChain({ content, count, onMultiply, onReset }: MultiplyChainProps) {
  return <section aria-labelledby="seven-chain" className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
    <h3 id="seven-chain" className="font-semibold text-primary">{content.chainTitle}</h3>
    <ol role="status" aria-live="polite" className="space-y-1 text-secondary tabular-nums">
      {Array.from({ length: count + 1 }, (_, step) => <li key={step}>{content.chainStep(step, hertz(keyFrequency(content.start, step)))}</li>)}
    </ol>
    {count < keysInOctave
      ? <Button color="secondary" size="lg" onClick={onMultiply}>{content.multiplyLabel}</Button>
      : <div className="space-y-3">
        <p className="font-medium text-primary">{content.done}</p>
        <Button color="tertiary" size="lg" onClick={onReset}>{content.resetLabel}</Button>
      </div>}
  </section>;
}
