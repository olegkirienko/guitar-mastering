import { PauseCircle, Play, RefreshCw01, StopCircle } from '@untitledui/icons';
import { useEffect, useRef, useState } from 'react';
import { ChoiceQuestion, type ChoiceQuestionChoice } from '@/components/lesson/ChoiceQuestion';

type StringState = 'rest' | 'playing' | 'paused' | 'stopped';

interface VirtualGuitarStringProps {
  observationChoices: readonly ChoiceQuestionChoice[];
  predictionChoices: readonly ChoiceQuestionChoice[];
  onExperimentComplete: () => void;
}

const motionFrames = [
  { offset: 0, label: 'Струна в середині, у звичному положенні.' },
  { offset: -30, label: 'Струна відхилилася в один бік.' },
  { offset: 0, label: 'Струна знову проходить через середину.' },
  { offset: 30, label: 'Струна відхилилася в інший бік.' },
] as const;

export function VirtualGuitarString({ observationChoices, predictionChoices, onExperimentComplete }: VirtualGuitarStringProps) {
  const [stringState, setStringState] = useState<StringState>('rest');
  const [elapsed, setElapsed] = useState(0);
  const [hasPlucked, setHasPlucked] = useState(false);
  const [predictionMade, setPredictionMade] = useState(false);
  const [predictionId, setPredictionId] = useState<string>();
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [slow, setSlow] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showFrames, setShowFrames] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [observationAttempts, setObservationAttempts] = useState(0);
  const animationStart = useRef<number | undefined>(undefined);
  const animationFrame = useRef<number | undefined>(undefined);
  const gestureStarted = useRef(false);

  const staticMode = prefersReducedMotion || showFrames;
  const isMoving = stringState === 'playing' && !staticMode;
  const frame = motionFrames[frameIndex];
  const cycleDuration = slow ? 6400 : 3200;
  const amplitude = Math.max(0, 30 * (1 - elapsed / cycleDuration));
  const offset = stringState === 'stopped' || stringState === 'rest' ? 0 : staticMode ? frame.offset : Math.sin(elapsed / (slow ? 210 : 105)) * amplitude;
  const isStopAvailable = experimentStarted && (stringState === 'playing' || (staticMode && stringState === 'paused'));
  const predictionLabel = predictionChoices.find((choice) => choice.id === predictionId)?.label;
  const visualDescription = stringState === 'stopped'
    ? 'Струна зупинена й лежить на прямій звичного положення.'
    : staticMode
      ? `${frame.label} Покадровий режим показує нерухомий кадр руху.`
      : stringState === 'playing'
        ? 'Струна рухається туди-назад і поступово заспокоюється.'
        : stringState === 'paused'
          ? 'Показ на паузі: струна зафіксована в поточному положенні.'
          : 'Струна у спокої між двома опорами.';
  const statusText = stringState === 'stopped'
    ? 'Струну зупинено — вона повернулася до звичного положення, а звук швидко стихає.'
    : staticMode && stringState === 'paused'
      ? `${frame.label} Покадрова модель показує: поки струна рухається туди-назад, звук триває й поступово стихає.`
      : stringState === 'playing'
        ? 'Струна рухається туди-назад; поки вона рухається, звук триває й поступово стихає.'
        : stringState === 'paused'
          ? 'Показ на паузі: кадр струни зафіксовано. Натисни «Продовжити», щоб далі спостерігати рух.'
          : hasPlucked
            ? 'Струна знову у спокої, звук стих.'
            : 'Струна поки нерухома, звуку немає.';
  const stopGuidance = !hasPlucked
    ? staticMode ? 'Спочатку покажи кадр руху струни.' : 'Спочатку смикни струну.'
    : !predictionMade
      ? 'Зроби й збережи прогноз, потім смикни струну ще раз.'
      : !experimentStarted
        ? staticMode ? 'Покажи наступний кадр, щоб почати перевірку прогнозу.' : 'Смикни струну, щоб почати перевірку прогнозу.'
        : stringState === 'paused' && !staticMode
          ? 'Продовж рух, а потім зупини струну.'
          : staticMode ? 'Покажи наступний кадр, щоб повторити дослід.' : 'Смикни струну ще раз, щоб зупинити її під час руху.';

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (!isMoving) return undefined;
    animationStart.current = performance.now() - elapsed;
    const animate = (time: number) => {
      const nextElapsed = time - (animationStart.current ?? time);
      if (nextElapsed >= cycleDuration) {
        setElapsed(cycleDuration);
        setStringState('rest');
        return;
      }
      setElapsed(nextElapsed);
      animationFrame.current = requestAnimationFrame(animate);
    };
    animationFrame.current = requestAnimationFrame(animate);
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current); };
  }, [cycleDuration, elapsed, isMoving]);

  function pluck() {
    setHasPlucked(true);
    setElapsed(0);
    setFrameIndex(1);
    setStringState(staticMode ? 'paused' : 'playing');
    if (predictionMade) setExperimentStarted(true);
  }

  function stop() {
    if (!isStopAvailable) return;
    setStringState('stopped');
    onExperimentComplete();
  }

  function nextFrame() {
    setHasPlucked(true);
    setFrameIndex((current) => (current + 1) % motionFrames.length);
    setStringState('paused');
    if (predictionMade) setExperimentStarted(true);
  }

  return <div className="space-y-7">
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-950">Віртуальна струна</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">Потягни її пальцем на сцені або скористайся кнопкою. Аудіо для цього досліду не потрібне.</p>
        </div>
        <button type="button" disabled={prefersReducedMotion} onClick={() => setShowFrames((current) => !current)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          {prefersReducedMotion ? 'Покадровий режим: системне налаштування' : staticMode ? 'Показувати рух' : 'Показувати покадрово'}
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-brand-200 bg-white">
        <div
          className="touch-none select-none p-4 sm:p-8"
          onPointerDown={() => { gestureStarted.current = true; }}
          onPointerUp={() => { if (gestureStarted.current) { pluck(); gestureStarted.current = false; } }}
          onPointerCancel={() => { gestureStarted.current = false; }}
        >
          <svg viewBox="0 0 320 160" className="h-auto w-full" role="img" aria-labelledby="string-visual-title string-visual-description">
            <title id="string-visual-title">Струна між двома опорами</title>
            <desc id="string-visual-description">{visualDescription}</desc>
            <rect x="20" y="66" width="16" height="28" rx="4" fill="#783923" />
            <rect x="284" y="66" width="16" height="28" rx="4" fill="#783923" />
            <line x1="36" y1="80" x2="284" y2="80" stroke="#98A2B3" strokeDasharray="5 5" strokeWidth="2" />
            <path d={`M 36 80 Q 160 ${80 + offset} 284 80`} fill="none" stroke="#91472c" strokeWidth="5" strokeLinecap="round" />
            <text x="160" y="138" textAnchor="middle" fill="#475467" fontSize="13">пунктир — звичне положення струни</text>
          </svg>
        </div>
        <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-700" aria-live="polite">
          {statusText}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {staticMode ? <button type="button" onClick={nextFrame} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><Play className="size-4" />Показати наступний кадр</button> : <>
          <button type="button" onClick={pluck} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><Play className="size-4" />Смикнути</button>
          <button type="button" disabled={stringState !== 'playing' && stringState !== 'paused'} onClick={() => setStringState((current) => current === 'playing' ? 'paused' : 'playing')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{stringState === 'playing' ? <PauseCircle className="size-4" /> : <Play className="size-4" />}{stringState === 'playing' ? 'Пауза' : 'Продовжити'}</button>
        </>}
        <button type="button" onClick={() => { setSlow((current) => !current); setElapsed(0); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><RefreshCw01 className="size-4" />{slow ? 'Швидкість: повільно' : 'Швидкість: 1×'}</button>
        <button type="button" disabled={!isStopAvailable} aria-describedby={!isStopAvailable ? 'stop-string-guidance' : undefined} onClick={stop} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><StopCircle className="size-4" />Зупинити струну</button>
      </div>
      {!isStopAvailable && <p id="stop-string-guidance" className="mt-2 text-sm text-gray-600">{stopGuidance}</p>}
    </div>

    {hasPlucked && <ChoiceQuestion question="Що робить струна, поки звук ще триває?" choices={observationChoices} correctChoiceId="moving" onCheck={(_, isCorrect) => { if (!isCorrect) setObservationAttempts((current) => current + 1); }} />}
    {observationAttempts >= 2 && <p className="rounded-lg bg-brand-25 p-4 text-sm leading-6 text-gray-700">Поглянь іще раз у повільному або покадровому режимі: струна повертається через пунктирну середину в обидва боки.</p>}

    {hasPlucked && <div className="border-t border-gray-200 pt-7">
      <ChoiceQuestion question="Що станеться зі звуком, якщо торкнутися струни й зупинити її?" choices={predictionChoices} correctChoiceId="fade" mode="prediction" checkLabel="Зберегти прогноз" onCheck={(choiceId) => { setPredictionId(choiceId); setPredictionMade(true); }} />
      {predictionMade && <div className="mt-5 rounded-lg bg-brand-25 p-4 text-sm leading-6 text-gray-700"><p>Тепер перевір: смикни струну ще раз і натисни «Зупинити струну», поки вона рухається.</p>{stringState === 'stopped' && <div className="mt-4 space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-white p-3"><p className="font-semibold text-gray-950">Мій прогноз</p><p className="mt-1">{predictionLabel}</p></div><div className="rounded-lg bg-white p-3"><p className="font-semibold text-gray-950">Побачив/ла</p><p className="mt-1">Струна зупинилася — звук швидко стих.</p></div></div><p><strong>{predictionId === 'fade' ? 'Твій прогноз справдився.' : 'Саме для цього й потрібен експеримент.'}</strong> Доки струна рухається туди-назад, вона передає рух гітарі й сусідньому повітрю. Коли струну зупиняємо, нові зміни в повітрі більше не виникають, а вже створені швидко проходять і згасають.</p></div>}</div>}
    </div>}
  </div>;
}
