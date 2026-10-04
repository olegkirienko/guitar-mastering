import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { Button } from '@/components/base/buttons/button';
import { useSoundPathCheckpoint } from '@/components/lesson/sound-path-checkpoint/hooks/use-sound-path-checkpoint';
import type { SoundPathCheckpointProps } from '@/components/lesson/sound-path-checkpoint/types';
import { cx } from '@/utils/cx';
import { CheckCircle, HelpCircle } from '@untitledui/icons';

export function SoundPathCheckpoint({ content, initiallyPassed, onComplete }: SoundPathCheckpointProps) {
  const { order, attempts, result, announcement, passed, setPassed, feedbackId, expectedOrder, sequenceReady, moveCard, handleDragStart, handleDrop, checkSequence, showSequence, hint } = useSoundPathCheckpoint({ content, initiallyPassed });
  if (passed) return <div className="rounded-lg border border-success-200 bg-success-50 p-5" role="status">
    <div className="flex gap-3">
      <CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" />
      <div><p className="font-semibold text-primary">Ти пояснив/ла шлях звуку.</p><p className="mt-1 text-sm leading-6 text-secondary">{content.summary}</p></div>
    </div>
  </div>;

  return <div className="space-y-7">
    <div>
      <h3 className="text-lg font-semibold text-primary">{content.question}</h3>
      <p className="mt-2 text-sm leading-6 text-tertiary">Перетягни картки або скористайся кнопками «Раніше» й «Пізніше». Номер показує поточну позицію.</p>
    </div>

    <ol className="space-y-3" aria-describedby={result !== 'idle' ? feedbackId : undefined}>
      {order.map((cardId, index) => {
        const card = content.cards.find((item) => item.id === cardId);
        if (!card) return null;
        const hasCorrectConnection = result !== 'idle' && index < order.length - 1 && expectedOrder[expectedOrder.indexOf(cardId) + 1] === order[index + 1];
        return <li
          key={card.id}
          draggable
          onDragStart={(event) => handleDragStart(event, card.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, index)}
          className={cx('rounded-xl border bg-primary p-4', hasCorrectConnection ? 'border-success-300' : 'border-secondary')}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700" aria-hidden="true">{index + 1}</span>
            <span className="text-2xl" aria-hidden="true">{card.illustration}</span>
            <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-6 text-secondary">{card.label}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 pl-12">
            <Button color="secondary" size="md" isDisabled={index === 0} onClick={() => moveCard(card.id, index - 1)} aria-label={`Перемістити «${card.label}» раніше`}>Раніше</Button>
            <Button color="secondary" size="md" isDisabled={index === order.length - 1} onClick={() => moveCard(card.id, index + 1)} aria-label={`Перемістити «${card.label}» пізніше`}>Пізніше</Button>
          </div>
          {hasCorrectConnection && <p className="mt-3 pl-12 text-xs font-semibold text-success-700">Наступна причинна ланка з'єднана правильно.</p>}
        </li>;
      })}
    </ol>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>

    {!sequenceReady && <Button size="lg" onClick={checkSequence}>Перевірити порядок</Button>}

    {result === 'incorrect' && <div id={feedbackId} role="status" className="rounded-lg bg-secondary p-4 text-sm leading-6 text-secondary">
      <div className="flex gap-3"><HelpCircle className="mt-0.5 size-5 shrink-0 text-brand-700" /><p><strong>Знайдено перший розрив.</strong> {hint}</p></div>
      {attempts >= 2 && <Button color="secondary" size="lg" className="mt-4" onClick={showSequence}>Показати й пояснити</Button>}
    </div>}

    {sequenceReady && <div id={feedbackId} className="space-y-6">
      <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-sm leading-6 text-secondary" role="status">
        <p className="font-semibold text-primary">{result === 'correct' ? 'Причинний порядок відновлено.' : 'Ось причинний порядок.'}</p>
        <p className="mt-1">{content.summary}</p>
      </div>
      <ChoiceQuestion question={content.controlQuestion} choices={content.controlChoices} correctChoiceId="wave" onCheck={(_, isCorrect) => {
        if (isCorrect) {
          setPassed(true);
          onComplete();
        }
      }} />
      <p className="rounded-lg border border-secondary bg-secondary p-4 text-sm leading-6 text-secondary">{content.application}</p>
    </div>}
  </div>;
}
