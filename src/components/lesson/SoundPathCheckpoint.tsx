import { useId, useState, type DragEvent } from 'react';
import { CheckCircle, HelpCircle } from '@untitledui/icons';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import { cx } from '@/lib/cx';

interface CheckpointCard {
  id: string;
  label: string;
  illustration: string;
}

interface CheckpointChoice {
  id: string;
  label: string;
  feedback: string;
}

interface SoundPathCheckpointContent {
  question: string;
  cards: readonly CheckpointCard[];
  initialOrder: readonly string[];
  breakHints: readonly string[];
  controlQuestion: string;
  controlChoices: readonly CheckpointChoice[];
  summary: string;
  application: string;
}

interface SoundPathCheckpointProps {
  content: SoundPathCheckpointContent;
  initiallyPassed: boolean;
  onComplete: () => void;
}

type SequenceResult = 'idle' | 'incorrect' | 'correct' | 'explained';

export function SoundPathCheckpoint({ content, initiallyPassed, onComplete }: SoundPathCheckpointProps) {
  const [order, setOrder] = useState<string[]>(initiallyPassed ? content.cards.map((card) => card.id) : [...content.initialOrder]);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<SequenceResult>(initiallyPassed ? 'correct' : 'idle');
  const [announcement, setAnnouncement] = useState('');
  const [passed, setPassed] = useState(initiallyPassed);
  const feedbackId = useId();
  const expectedOrder = content.cards.map((card) => card.id);
  const sequenceReady = result === 'correct' || result === 'explained';

  const moveCard = (cardId: string, targetIndex: number) => {
    const currentIndex = order.indexOf(cardId);
    const boundedIndex = Math.max(0, Math.min(targetIndex, order.length - 1));
    if (currentIndex === boundedIndex) return;
    const nextOrder = [...order];
    nextOrder.splice(currentIndex, 1);
    nextOrder.splice(boundedIndex, 0, cardId);
    setOrder(nextOrder);
    setResult('idle');
    const card = content.cards.find((item) => item.id === cardId);
    setAnnouncement(`${card?.label ?? 'Картку'} переміщено на позицію ${boundedIndex + 1} із ${order.length}.`);
  };

  const handleDragStart = (event: DragEvent<HTMLLIElement>, cardId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cardId);
  };

  const handleDrop = (event: DragEvent<HTMLLIElement>, targetIndex: number) => {
    event.preventDefault();
    const cardId = event.dataTransfer.getData('text/plain');
    if (order.includes(cardId)) moveCard(cardId, targetIndex);
  };

  const checkSequence = () => {
    const isCorrect = order.every((cardId, index) => cardId === expectedOrder[index]);
    setAttempts((current) => current + 1);
    setResult(isCorrect ? 'correct' : 'incorrect');
  };

  const showSequence = () => {
    setOrder(expectedOrder);
    setResult('explained');
    setAnnouncement('Правильний причинний порядок показано й пояснено.');
  };

  const firstBreakIndex = expectedOrder.findIndex((cardId, index) => order[index] !== cardId);
  const hint = content.breakHints[Math.max(firstBreakIndex, 0)];

  if (passed) return <div className="rounded-lg border border-success-200 bg-success-50 p-5" role="status">
    <div className="flex gap-3">
      <CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" />
      <div><p className="font-semibold text-gray-950">Ти пояснив/ла шлях звуку.</p><p className="mt-1 text-sm leading-6 text-gray-700">{content.summary}</p></div>
    </div>
  </div>;

  return <div className="space-y-7">
    <div>
      <h3 className="text-lg font-semibold text-gray-950">{content.question}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">Перетягни картки або скористайся кнопками «Раніше» й «Пізніше». Номер показує поточну позицію.</p>
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
          className={cx('rounded-xl border bg-white p-4', hasCorrectConnection ? 'border-success-300' : 'border-gray-200')}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700" aria-hidden="true">{index + 1}</span>
            <span className="text-2xl" aria-hidden="true">{card.illustration}</span>
            <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-6 text-gray-800">{card.label}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 pl-12">
            <button type="button" disabled={index === 0} onClick={() => moveCard(card.id, index - 1)} aria-label={`Перемістити «${card.label}» раніше`} className="min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Раніше</button>
            <button type="button" disabled={index === order.length - 1} onClick={() => moveCard(card.id, index + 1)} aria-label={`Перемістити «${card.label}» пізніше`} className="min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Пізніше</button>
          </div>
          {hasCorrectConnection && <p className="mt-3 pl-12 text-xs font-semibold text-success-700">Наступна причинна ланка з'єднана правильно.</p>}
        </li>;
      })}
    </ol>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>

    {!sequenceReady && <button type="button" onClick={checkSequence} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Перевірити порядок</button>}

    {result === 'incorrect' && <div id={feedbackId} role="status" className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
      <div className="flex gap-3"><HelpCircle className="mt-0.5 size-5 shrink-0 text-brand-700" /><p><strong>Знайдено перший розрив.</strong> {hint}</p></div>
      {attempts >= 2 && <button type="button" onClick={showSequence} className="mt-4 min-h-11 rounded-lg border border-brand-300 bg-white px-4 py-2.5 font-semibold text-brand-700 outline-none hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Показати й пояснити</button>}
    </div>}

    {sequenceReady && <div id={feedbackId} className="space-y-6">
      <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-sm leading-6 text-gray-700" role="status">
        <p className="font-semibold text-gray-950">{result === 'correct' ? 'Причинний порядок відновлено.' : 'Ось причинний порядок.'}</p>
        <p className="mt-1">{content.summary}</p>
      </div>
      <ChoiceQuestion question={content.controlQuestion} choices={content.controlChoices} correctChoiceId="wave" onCheck={(_, isCorrect) => {
        if (isCorrect) {
          setPassed(true);
          onComplete();
        }
      }} />
      <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">{content.application}</p>
    </div>}
  </div>;
}
