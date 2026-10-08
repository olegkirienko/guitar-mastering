import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { useStepWalk } from '@/components/lesson/step-walk/hooks/use-step-walk';
import type { StepWalkProps } from '@/components/lesson/step-walk/types';
import { baseFrequency, lastKeyNumber } from '@/data/lessons/stage-02-lesson-02-model/constants';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';

export function StepWalk({ content, keyRowLabel, keyLabel, audio, gain, onDone }: StepWalkProps) {
  const { sequence, answer, setAnswer, result, steps, play, check, reveal } = useStepWalk({ audio, gain, onDone });
  return <div className="space-y-5">
    <KeyRow label={keyRowLabel} count={lastKeyNumber + 1} base={baseFrequency} keyLabel={keyLabel} onPlay={(key) => audio.playTone(keyFrequency(baseFrequency, key), gain)} highlighted={sequence.playing ? [sequence.index] : []} />
    {audio.enabled
      ? <div className="flex flex-wrap gap-3">
        <Button color="secondary" size="lg" onClick={play}>{content.playLabel}</Button>
        {sequence.playing && <Button color="tertiary" size="lg" onClick={sequence.stop}>{content.stopLabel}</Button>}
      </div>
      : <p className="text-secondary">{content.withoutAudio}</p>}
    <p role="status" className="font-medium text-primary">{content.progressLabel(steps)}</p>
    <div className="space-y-3">
      <p className="font-medium text-primary">{content.answerLabel}</p>
      <div className="flex flex-wrap items-end gap-3">
        <Input label={content.answerInputLabel} inputMode="numeric" value={answer} onChange={setAnswer} isInvalid={result === 'wrong'} />
        <Button size="lg" isDisabled={answer.trim() === ''} onClick={check}>{content.checkLabel}</Button>
        <Button color="tertiary" size="lg" onClick={reveal}>{content.revealLabel}</Button>
      </div>
      <div role="status" className="space-y-2">
        {result === 'right' && <p className="font-medium text-primary">{content.right}</p>}
        {result === 'wrong' && <p className="text-secondary">{content.wrong}</p>}
        {result === 'revealed' && <p className="font-medium text-primary">{content.reveal}</p>}
        {(result === 'right' || result === 'revealed') && <>
          <p className="text-secondary">{content.observation}</p>
          <p className="font-medium text-primary">{content.pattern}</p>
        </>}
      </div>
    </div>
  </div>;
}
