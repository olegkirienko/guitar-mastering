import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { useFrequencyPitchCheckpoint } from '@/components/lesson/frequency-pitch-checkpoint/hooks/use-frequency-pitch-checkpoint';
import type { FrequencyPitchCheckpointProps } from '@/components/lesson/frequency-pitch-checkpoint/types';
import { checkpointPassed } from '@/data/lessons/stage-01-lesson-02-model/utils/chain';

// Screen 6: a new pair, the causal chain, and the loudness counterexample.
export function FrequencyPitchCheckpoint({ content, passed, onPass }: FrequencyPitchCheckpointProps) {
  const { order, outcome, explained, counterCorrect, setCounterCorrect, moveMessage, moveButtons, chainStatus, chainDone, links, move, checkOrder, explain } = useFrequencyPitchCheckpoint({ content, passed, onPass });
  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3">
      {content.pair.map((tone) => <div key={tone.hz} className="rounded-lg border border-secondary bg-primary p-4 text-center">
        <p className="text-lg font-semibold text-primary" aria-hidden="true">{tone.label}</p>
        <p className="sr-only">{tone.spoken}</p>
      </div>)}
    </div>
    <ChoiceQuestion question={content.moreQuestion} choices={content.moreChoices} correctChoiceId="500" />
    <ChoiceQuestion question={content.higherQuestion} choices={content.higherChoices} correctChoiceId="500" />

    <section aria-labelledby="chain-title" className="rounded-lg border border-secondary bg-primary p-5">
      <h3 id="chain-title" className="font-semibold text-primary">{content.chainTitle}</h3>
      <p className="mt-1 text-sm text-tertiary">{content.chainInstruction}</p>
      <ol className="mt-4 space-y-2">
        {order.map((card, index) => <li key={card} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-secondary p-3">
            <span className="text-sm font-medium text-primary">{index + 1}. {content.cards[card]}</span>
            <span className="flex gap-2">
              <Button
                color="secondary"
                size="md"
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                ref={(element) => { if (element) moveButtons.current.set(`${card}-earlier`, element); }}
                aria-disabled={chainDone || index === 0}
                aria-label={`${content.earlierLabel}: ${content.cards[card]}`}
                onClick={() => move(index, -1)}
              >{content.earlierLabel}</Button>
              <Button
                color="secondary"
                size="md"
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                ref={(element) => { if (element) moveButtons.current.set(`${card}-later`, element); }}
                aria-disabled={chainDone || index === order.length - 1}
                aria-label={`${content.laterLabel}: ${content.cards[card]}`}
                onClick={() => move(index, 1)}
              >{content.laterLabel}</Button>
            </span>
          </div>
          {index < order.length - 1 && outcome && outcome !== 'correct' && links[index] && <p className="pl-3 text-sm text-success-600">↓ {content.correctLink}</p>}
        </li>)}
      </ol>
      <p aria-live="polite" data-testid="chain-move-status" className="sr-only">{chainDone ? '' : moveMessage}</p>
      {!chainDone && <Button size="lg" className="mt-4" onClick={checkOrder}>{content.checkOrderLabel}</Button>}
      <div ref={chainStatus} tabIndex={-1} role="status" data-testid="chain-status" className="mt-3 space-y-2 text-sm text-secondary outline-none">
        {outcome === 'correct' && <p>{content.orderCorrect}</p>}
        {!chainDone && (outcome === 'hint' || outcome === 'offer-explanation') && <p>{content.orderHint}</p>}
        {explained && <p>{content.explanation}</p>}
      </div>
      {!chainDone && outcome === 'offer-explanation' && <Button color="secondary" size="lg" className="mt-3" onClick={explain}>{content.explainLabel}</Button>}
    </section>

    {chainDone && <ChoiceQuestion
      question={content.counterQuestion}
      spokenQuestion={content.counterQuestionSpoken}
      choices={content.counterChoices}
      correctChoiceId={content.counterCorrectId}
      onCheck={(_choiceId, isCorrect) => { if (isCorrect) setCounterCorrect(true); }}
    />}
    <div aria-live="polite" className="text-sm font-semibold text-primary">{checkpointPassed(chainDone, counterCorrect) && <p>{content.passed}</p>}</div>
  </div>;
}
