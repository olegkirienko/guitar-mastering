import { useEffect, useRef, useState } from 'react';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02';
import {
  chainAttemptOutcome,
  checkpointPassed,
  correctAdjacentLinks,
  correctChain,
  initialChain,
  moveCard,
  type ChainAttemptOutcome,
  type ChainCard,
} from '@/data/lessons/stage-01-lesson-02-model';

type CheckpointContent = typeof lessonTwoContent.checkpoint;

interface FrequencyPitchCheckpointProps {
  content: CheckpointContent;
  passed: boolean;
  onPass: () => void;
}

const moveButton = 'min-h-11 min-w-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';

// Screen 6: a new pair, the causal chain, and the loudness counterexample.
export function FrequencyPitchCheckpoint({ content, passed, onPass }: FrequencyPitchCheckpointProps) {
  const [order, setOrder] = useState<ChainCard[]>(passed ? [...correctChain] : [...initialChain]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [outcome, setOutcome] = useState<ChainAttemptOutcome | null>(passed ? 'correct' : null);
  const [explained, setExplained] = useState(false);
  const [counterCorrect, setCounterCorrect] = useState(passed);
  const [focusMove, setFocusMove] = useState<{ card: ChainCard; direction: 'earlier' | 'later' } | null>(null);
  const moveButtons = useRef(new Map<string, HTMLButtonElement>());
  const chainStatus = useRef<HTMLDivElement>(null);
  const focusStatusWhenDone = useRef(false);
  const reported = useRef(passed);
  const chainDone = outcome === 'correct' || explained;
  const links = correctAdjacentLinks(order);

  useEffect(() => {
    if (!focusMove) return;
    moveButtons.current.get(`${focusMove.card}-${focusMove.direction}`)?.focus();
    setFocusMove(null);
  }, [focusMove]);

  // The check and explain buttons disappear once the chain is done, so focus
  // moves to the result instead of dropping to the page.
  useEffect(() => {
    if (!chainDone || !focusStatusWhenDone.current) return;
    focusStatusWhenDone.current = false;
    chainStatus.current?.focus();
  }, [chainDone]);

  useEffect(() => {
    if (reported.current || !checkpointPassed(chainDone, counterCorrect)) return;
    reported.current = true;
    onPass();
  }, [chainDone, counterCorrect, onPass]);

  const move = (index: number, direction: -1 | 1) => {
    if (chainDone) return;
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder(moveCard(order, index, direction));
    setOutcome(null);
    setFocusMove({ card: order[index], direction: direction === -1 ? 'earlier' : 'later' });
  };
  const checkOrder = () => {
    const result = chainAttemptOutcome(order, failedAttempts);
    if (result === 'correct') focusStatusWhenDone.current = true;
    setOutcome(result);
    if (result !== 'correct') setFailedAttempts((count) => count + 1);
  };
  const explain = () => {
    focusStatusWhenDone.current = true;
    setOrder([...correctChain]);
    setExplained(true);
  };

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
      choices={content.counterChoices}
      correctChoiceId={content.counterCorrectId}
      onCheck={(_choiceId, isCorrect) => { if (isCorrect) setCounterCorrect(true); }}
    />}
    <div aria-live="polite" className="text-sm font-semibold text-gray-950">{checkpointPassed(chainDone, counterCorrect) && <p>{content.passed}</p>}</div>
  </div>;
}
