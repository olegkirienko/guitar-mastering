import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { moveButton } from '@/components/lesson/frequency-pitch-checkpoint/constants';
import { useFrequencyPitchCheckpoint } from '@/components/lesson/frequency-pitch-checkpoint/hooks/use-frequency-pitch-checkpoint';
import type { FrequencyPitchCheckpointProps } from '@/components/lesson/frequency-pitch-checkpoint/types';
import { checkpointPassed } from '@/data/lessons/stage-01-lesson-02-model/utils/chain';

// Screen 6: a new pair, the causal chain, and the loudness counterexample.
export function FrequencyPitchCheckpoint({ content, passed, onPass }: FrequencyPitchCheckpointProps) {
  const { order, outcome, explained, counterCorrect, setCounterCorrect, moveMessage, moveButtons, chainStatus, chainDone, links, move, checkOrder, explain } = useFrequencyPitchCheckpoint({ content, passed, onPass });
  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3">
      {content.pair.map((tone) => <div key={tone.hz} className="rounded-lg border border-gray-200 bg-white p-4 text-center">
        <p className="text-lg font-semibold text-gray-950" aria-hidden="true">{tone.label}</p>
        <p className="sr-only">{tone.spoken}</p>
      </div>)}
    </div>
    <ChoiceQuestion question={content.moreQuestion} choices={content.moreChoices} correctChoiceId="500" />
    <ChoiceQuestion question={content.higherQuestion} choices={content.higherChoices} correctChoiceId="500" />

    <section aria-labelledby="chain-title" className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 id="chain-title" className="font-semibold text-gray-950">{content.chainTitle}</h3>
      <p className="mt-1 text-sm text-gray-600">{content.chainInstruction}</p>
      <ol className="mt-4 space-y-2">
        {order.map((card, index) => <li key={card} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3">
            <span className="text-sm font-medium text-gray-950">{index + 1}. {content.cards[card]}</span>
            <span className="flex gap-2">
              <button
                ref={(element) => { if (element) moveButtons.current.set(`${card}-earlier`, element); }}
                type="button"
                aria-disabled={chainDone || index === 0}
                aria-label={`${content.earlierLabel}: ${content.cards[card]}`}
                onClick={() => move(index, -1)}
                className={moveButton}
              >{content.earlierLabel}</button>
              <button
                ref={(element) => { if (element) moveButtons.current.set(`${card}-later`, element); }}
                type="button"
                aria-disabled={chainDone || index === order.length - 1}
                aria-label={`${content.laterLabel}: ${content.cards[card]}`}
                onClick={() => move(index, 1)}
                className={moveButton}
              >{content.laterLabel}</button>
            </span>
          </div>
          {index < order.length - 1 && outcome && outcome !== 'correct' && links[index] && <p className="pl-3 text-sm text-success-600">↓ {content.correctLink}</p>}
        </li>)}
      </ol>
      <p aria-live="polite" data-testid="chain-move-status" className="sr-only">{chainDone ? '' : moveMessage}</p>
      {!chainDone && <button type="button" onClick={checkOrder} className="mt-4 min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.checkOrderLabel}</button>}
      <div ref={chainStatus} tabIndex={-1} role="status" data-testid="chain-status" className="mt-3 space-y-2 text-sm text-gray-700 outline-none">
        {outcome === 'correct' && <p>{content.orderCorrect}</p>}
        {!chainDone && (outcome === 'hint' || outcome === 'offer-explanation') && <p>{content.orderHint}</p>}
        {explained && <p>{content.explanation}</p>}
      </div>
      {!chainDone && outcome === 'offer-explanation' && <button type="button" onClick={explain} className="mt-3 min-h-11 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-25 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.explainLabel}</button>}
    </section>

    {chainDone && <ChoiceQuestion
      question={content.counterQuestion}
      spokenQuestion={content.counterQuestionSpoken}
      choices={content.counterChoices}
      correctChoiceId={content.counterCorrectId}
      onCheck={(_choiceId, isCorrect) => { if (isCorrect) setCounterCorrect(true); }}
    />}
    <div aria-live="polite" className="text-sm font-semibold text-gray-950">{checkpointPassed(chainDone, counterCorrect) && <p>{content.passed}</p>}</div>
  </div>;
}
