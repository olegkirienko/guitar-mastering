import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { Button } from '@/components/base/buttons/button';
import { useSoundPathCheckpoint } from '@/components/lesson/sound-path-checkpoint/hooks/use-sound-path-checkpoint';
import type { SoundPathCheckpointProps } from '@/components/lesson/sound-path-checkpoint/types';
import { canRevealNextLink } from '@/components/lesson/sound-path-checkpoint/utils/chain';
import { CheckCircle, HelpCircle } from '@untitledui/icons';

export function SoundPathCheckpoint({ content, initiallyPassed, onComplete }: SoundPathCheckpointProps) {
  const { chain, attempts, explained, announcement, passed, setPassed, feedbackId, questionId, questionRef, summaryRef, isComplete, offered, hint, pick, revealNext, labelOf } = useSoundPathCheckpoint({ content, initiallyPassed });
  if (passed) return <div className="rounded-lg border border-success-200 bg-success-50 p-5" role="status">
    <div className="flex gap-3">
      <CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" />
      <div><p className="font-semibold text-primary">{content.passed}</p><p className="mt-1 text-sm leading-6 text-secondary">{content.summary}</p></div>
    </div>
  </div>;

  return <div className="space-y-7">
    <div>
      <h3 className="text-lg font-semibold text-primary">{content.question}</h3>
      <p className="mt-2 text-sm leading-6 text-tertiary">Першу ланку вже поставлено. Додавай по одній: обери, що відбувається далі.</p>
    </div>

    <ol aria-label="Зібраний ланцюг" className="space-y-3">
      {chain.map((cardId, index) => {
        const card = content.cards.find((item) => item.id === cardId);
        if (!card) return null;
        return <li key={card.id} className="rounded-xl border border-success-300 bg-primary p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-brand-secondary" aria-hidden="true">{index + 1}</span>
            <span className="text-2xl" aria-hidden="true">{card.illustration}</span>
            <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-6 text-secondary">{card.label}</p>
          </div>
        </li>;
      })}
    </ol>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>

    {!isComplete && <div role="group" aria-labelledby={questionId} aria-describedby={attempts > 0 ? feedbackId : undefined}>
      <h4 id={questionId} ref={questionRef} tabIndex={-1} className="text-base font-semibold text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">Що відбувається далі?</h4>
      <div className="mt-3 space-y-2">
        {offered.map((cardId) => <Button key={cardId} color="secondary" size="lg" className="w-full justify-start text-left" onClick={() => pick(cardId)}>{labelOf(cardId)}</Button>)}
      </div>
      {attempts > 0 && <div id={feedbackId} role="status" className="mt-4 rounded-lg bg-secondary p-4 text-sm leading-6 text-secondary">
        <div className="flex gap-3"><HelpCircle className="mt-0.5 size-5 shrink-0 text-brand-secondary" /><p><strong>Ще не ця ланка.</strong> {hint}</p></div>
        {canRevealNextLink(attempts) && <Button color="secondary" size="lg" className="mt-4" onClick={revealNext}>Показати й пояснити</Button>}
      </div>}
    </div>}

    {isComplete && <div className="space-y-6">
      <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-sm leading-6 text-secondary" role="status">
        <p ref={summaryRef} tabIndex={-1} className="font-semibold text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">{explained ? 'Ось причинний порядок.' : 'Причинний порядок відновлено.'}</p>
        <p className="mt-1">{content.summary}</p>
      </div>
      <ChoiceQuestion question={content.controlQuestion} choices={content.controlChoices} correctChoiceId={content.correctChoiceId} onCheck={(_, isCorrect) => {
        if (isCorrect) {
          setPassed(true);
          onComplete();
        }
      }} />
      <p className="rounded-lg border border-secondary bg-secondary p-4 text-sm leading-6 text-secondary">{content.application}</p>
    </div>}
  </div>;
}
