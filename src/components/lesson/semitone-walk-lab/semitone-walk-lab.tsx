import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { OffsetKeyRow } from '@/components/lesson/offset-key-row/offset-key-row';
import { offsetFrequency } from '@/components/lesson/offset-key-row/utils/offset';
import { useSemitoneWalkLab } from '@/components/lesson/semitone-walk-lab/hooks/use-semitone-walk-lab';
import type { SemitoneWalkLabProps } from '@/components/lesson/semitone-walk-lab/types';
import { namesOfStep, walkFrequencies } from '@/components/lesson/semitone-walk-lab/utils/walk';
import { ToneSequence } from '@/components/lesson/tone-sequence/tone-sequence';
import { formatHertz, walkSteps, walkStartLetters } from '@/data/lessons/stage-02-lesson-05/constants';
import { keyOfName } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';

export function SemitoneWalkLab({ content, keys, audio, gain, predictionLabel, onSolved }: SemitoneWalkLabProps) {
  const lab = useSemitoneWalkLab({ onSolved });
  const { start, step, named, finished, letter, sign, verdict } = lab;
  const chosen = start ?? 0;
  const currentNamed = named.includes(step);
  const captions = start === null
    ? Object.fromEntries(walkStartLetters.map((name) => [keyOfName(name), name]))
    : lab.captions;
  const startName = start === null ? '' : namesOfStep(start, 0)[0];
  return <div className="space-y-6">
    <OffsetKeyRow
      label={start === null ? content.startGroupLabel : keys.keyRowLabel}
      start={chosen}
      colors={keys.colors}
      keyLabel={keys.keyLabel}
      onPlay={(key) => {
        audio.playTone(offsetFrequency(chosen, key), gain);
        if (start === null) lab.chooseStart(key);
      }}
      highlighted={start === null ? [] : [step]}
      trail={lab.named}
      captions={captions}
    />
    {start === null && <p className="text-secondary">{content.instruction}</p>}
    {start !== null && <section className="space-y-4">
      <p role="status" className="font-medium tabular-nums text-primary">
        {content.progress(step, walkSteps)}. {content.current(formatHertz(offsetFrequency(chosen, step)))}
      </p>
      {!currentNamed && <div className="space-y-3">
        <div role="group" aria-label={content.letterLabel} className="flex flex-wrap gap-2">
          {walkStartLetters.map((name) => <Button key={name} color={letter === name ? 'primary' : 'secondary'} aria-pressed={letter === name} onClick={() => lab.setLetter(name)}>{name}</Button>)}
        </div>
        <div role="group" aria-label={content.signLabel} className="flex flex-wrap gap-2">
          {content.signs.map((option) => <Button key={option.id || 'plain'} color={sign === option.id ? 'primary' : 'secondary'} aria-pressed={sign === option.id} aria-label={option.spoken} onClick={() => lab.setSign(option.id)}>
            <span aria-hidden="true">{option.label}</span>
          </Button>)}
        </div>
        <Button size="lg" isDisabled={letter === null} onClick={lab.submitName}>{content.checkLabel}</Button>
      </div>}
      <p role="status" className="text-sm text-secondary">
        {verdict === 'right' ? content.right(namesOfStep(chosen, step)) : verdict === 'wrong' ? content.hint(step) : null}
      </p>
      {currentNamed && step < walkSteps && <Button size="lg" onClick={lab.stepUp}>{content.stepLabel}</Button>}
    </section>}
    {finished && <section className="space-y-4">
      <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 font-medium text-primary tabular-nums">
        {content.finished(startName, formatHertz(offsetFrequency(chosen, 0)), formatHertz(offsetFrequency(chosen, walkSteps)))}
      </p>
      {predictionLabel && <p className="text-sm text-secondary">{content.prediction(predictionLabel)}</p>}
      <ChoiceQuestion question={content.pattern.question} choices={content.pattern.choices} correctChoiceId={content.pattern.correctChoiceId} onCheck={lab.answerSentence} />
    </section>}
    {start !== null && <div className="flex flex-wrap items-center gap-3">
      <ToneSequence sequences={[{ id: 'circle', label: content.listenLabel, frequencies: walkFrequencies(chosen) }]} stopLabel={content.stopLabel} audio={audio} gain={gain} />
      {finished && <Button color="secondary" onClick={lab.restart}>{content.otherLabel}</Button>}
    </div>}
    {!audio.enabled && <p className="text-secondary">{content.withoutAudio}</p>}
  </div>;
}
