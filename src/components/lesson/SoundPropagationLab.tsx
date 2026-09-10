import { PauseCircle, Play, RefreshCw01, StopCircle } from '@untitledui/icons';
import { useEffect, useId, useState } from 'react';
import { ChoiceQuestion, type ChoiceQuestionChoice } from '@/components/lesson/ChoiceQuestion';

export interface SoundPropagationLabContent {
  predictionQuestion: string;
  predictionChoices: readonly ChoiceQuestionChoice[];
  observationQuestion: string;
  observationChoices: readonly ChoiceQuestionChoice[];
  staticFrames: readonly { title: string; description: string }[];
  reveal: string;
}

interface SoundPropagationLabProps {
  content: SoundPropagationLabContent;
  staticMode: boolean;
  onComplete: () => void;
}

type PlaybackState = 'idle' | 'playing' | 'paused' | 'finished';

const airMarkers = [98, 124, 150, 176, 202, 228, 254];
const lastFrame = 7;
const markerOffsets = [
  [4, -4, 0, 0, 0, 0, 0],
  [0, 0, 4, -4, 0, 0, 0],
  [0, 0, 0, 4, 8, -4, 0],
  [0, 0, 0, 0, 0, 0, 0],
] as const;
const wavefrontPositions = [111, 163, 217, 302] as const;
const rarefactionPositions = [135, 187, 195] as const;
const staticFrameMap = [1, 2, 4, 6] as const;

function PredictionMiniScheme({ model }: { model: 'same-air' | 'change' }) {
  return <svg viewBox="0 0 180 42" className="mt-3 h-auto w-full max-w-52" aria-hidden="true">
    <line x1="15" y1="21" x2="165" y2="21" stroke="#D0D5DD" strokeWidth="2" />
    {model === 'same-air' ? <>
      <circle cx="25" cy="21" r="7" fill="#91472c" />
      <path d="M 40 21 H 143" stroke="#91472c" strokeWidth="2" markerEnd="url(#prediction-arrow-a)" />
      <circle cx="155" cy="21" r="7" fill="#91472c" />
      <defs><marker id="prediction-arrow-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#91472c" /></marker></defs>
    </> : <>
      {[25, 51, 77, 103, 129, 155].map((x, index) => <circle key={x} cx={x + (index === 2 ? 4 : index === 3 ? -4 : 0)} cy="21" r="5" fill={index === 2 ? '#91472c' : '#98A2B3'} />)}
      <path d="M 31 9 H 149" stroke="#91472c" strokeWidth="2" markerEnd="url(#prediction-arrow-b)" />
      <path d="M 68 34 H 86 M 68 34 L 73 31 M 68 34 L 73 37 M 86 34 L 81 31 M 86 34 L 81 37" stroke="#783923" strokeWidth="1.5" />
      <defs><marker id="prediction-arrow-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#91472c" /></marker></defs>
    </>}
  </svg>;
}

function frameDescription(frame: number, sourceStopped: boolean) {
  if (frame === 0) return 'Струна, корпус, ділянки повітря та вухо перебувають у спокої.';
  if (frame === 1) return 'Струна рухається навколо свого положення спокою.';
  if (frame === 2) return 'Струна передала рух корпусу, а корпус змінив стан сусіднього повітря.';
  if (frame < 6) return 'Стиснення й розрідження передаються праворуч. Виділена ділянка повітря лише трохи зміщується біля своєї мітки.';
  if (frame === 6) return 'Зміна досягла вуха й трохи рухнула барабанну перетинку.';
  return sourceStopped
    ? 'Струна зупинена. Уже створена зміна завершила шлях до вуха, і система заспокоїлася.'
    : 'Один короткий прогін завершено: ділянки повітря повернулися до своїх середніх положень.';
}

export function SoundPropagationLab({ content, staticMode, onComplete }: SoundPropagationLabProps) {
  const predictionGroupId = useId();
  const [predictionId, setPredictionId] = useState<string>();
  const [predictionChecked, setPredictionChecked] = useState(false);
  const [predictionMade, setPredictionMade] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>('idle');
  const [frame, setFrame] = useState(0);
  const [sourceStopped, setSourceStopped] = useState(false);
  const [observationAnswered, setObservationAnswered] = useState(false);
  const [observationAttempts, setObservationAttempts] = useState(0);
  const [staticReviewed, setStaticReviewed] = useState(false);
  const [staticFrameIndex, setStaticFrameIndex] = useState(0);

  useEffect(() => {
    if (playback !== 'playing' || staticMode) return undefined;
    const timer = window.setTimeout(() => {
      setFrame((current) => {
        if (current >= lastFrame - 1) {
          setPlayback('finished');
          onComplete();
          return lastFrame;
        }
        return current + 1;
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [frame, onComplete, playback, staticMode]);

  useEffect(() => {
    if (staticMode) setPlayback((current) => current === 'playing' ? 'paused' : current);
  }, [staticMode]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setPlayback((current) => current === 'playing' ? 'paused' : current);
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  const displayedFrame = staticMode ? staticFrameMap[staticFrameIndex] : frame;
  const frontIndex = displayedFrame >= 3 && displayedFrame <= 6 ? displayedFrame - 3 : -1;
  const wavefrontX = frontIndex < 0 ? -20 : wavefrontPositions[frontIndex];
  const activeMarkerOffsets = frontIndex < 0 ? undefined : markerOffsets[frontIndex];
  const rarefactionX = frontIndex >= 0 && frontIndex < rarefactionPositions.length ? rarefactionPositions[frontIndex] : undefined;
  const stringOffset = sourceStopped || displayedFrame === 0 || displayedFrame >= lastFrame ? 0 : displayedFrame % 2 === 0 ? -11 : 11;
  const eardrumOffset = displayedFrame === 6 ? -4 : 0;
  const status = frameDescription(displayedFrame, sourceStopped);
  const selectedPrediction = content.predictionChoices.find((choice) => choice.id === predictionId);
  const modelObserved = playback === 'finished' || staticReviewed;

  function play() {
    if (playback === 'finished') {
      setFrame(0);
      setSourceStopped(false);
    }
    setPlayback('playing');
  }

  function replay() {
    setFrame(0);
    setSourceStopped(false);
    setObservationAnswered(false);
    setObservationAttempts(0);
    setStaticReviewed(false);
    setPlayback('playing');
  }

  function stopSource() {
    setSourceStopped(true);
  }

  function finishStaticReview() {
    setStaticReviewed(true);
    onComplete();
  }

  function nextStaticFrame() {
    if (staticFrameIndex === staticFrameMap.length - 1) {
      finishStaticReview();
      return;
    }
    setStaticFrameIndex((current) => current + 1);
  }

  return <div className="space-y-7">
    <fieldset className="space-y-4" aria-describedby={predictionChecked ? `${predictionGroupId}-feedback` : undefined}>
      <legend className="text-lg font-semibold text-gray-950">{content.predictionQuestion}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {content.predictionChoices.map((choice) => <label key={choice.id} className="flex cursor-pointer flex-col rounded-lg border border-gray-200 p-4 text-gray-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:focus-visible]:ring-offset-2 last:sm:col-span-2">
          <span className="flex items-start gap-3"><input type="radio" name={predictionGroupId} value={choice.id} checked={predictionId === choice.id} onChange={() => { setPredictionId(choice.id); setPredictionChecked(false); }} className="mt-1 size-4 accent-brand-600" /><span>{choice.label}</span></span>
          {(choice.id === 'same-air' || choice.id === 'change') && <PredictionMiniScheme model={choice.id} />}
        </label>)}
      </div>
      <button type="button" disabled={!predictionId} onClick={() => { setPredictionChecked(true); setPredictionMade(true); }} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Зберегти прогноз</button>
      {predictionChecked && selectedPrediction && <div id={`${predictionGroupId}-feedback`} role="status" className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700"><p><strong>Прогноз збережено.</strong> {selectedPrediction.feedback}</p></div>}
    </fieldset>

    {predictionMade && <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-950">Лабораторія поширення звуку</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Рух сильно сповільнено й збільшено, щоб його було видно. Стеж за смугастою ділянкою повітря та за контуром зміни.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">якісна модель</span>
          {staticMode && <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">покадровий режим</span>}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-brand-200 bg-white">
        <svg viewBox="0 0 360 190" className="h-auto min-w-[560px] w-full" role="img" focusable="false" aria-labelledby="propagation-title propagation-description">
          <title id="propagation-title">Струна, корпус гітари, ділянки повітря та вухо</title>
          <desc id="propagation-description">{status}</desc>
          <g aria-hidden="true">
          <rect x="0" y="0" width="360" height="190" fill="#fff" />
          <text x="42" y="24" textAnchor="middle" fill="#475467" fontSize="11">струна й корпус</text>
          <text x="178" y="24" textAnchor="middle" fill="#475467" fontSize="11">малі ділянки повітря</text>
          <text x="323" y="24" textAnchor="middle" fill="#475467" fontSize="11">вухо</text>

          <path d="M 61 52 Q 87 95 61 138 L 42 138 L 42 52 Z" transform={displayedFrame === 2 && !sourceStopped ? 'translate(3 0)' : undefined} fill="#f0ddd2" stroke="#783923" strokeWidth="3" />
          <line x1="25" y1="95" x2="62" y2={95 + stringOffset} stroke="#91472c" strokeWidth="4" strokeLinecap="round" />
          <line x1="25" y1="95" x2="62" y2="95" stroke="#98A2B3" strokeDasharray="3 3" />

          <line x1="94" y1="46" x2="276" y2="46" stroke="#475467" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
          <text x="185" y="40" textAnchor="middle" fill="#475467" fontSize="10">зміна передається далі</text>
          <defs>
            <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#475467" /></marker>
            <pattern id="tracked-air-pattern" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#f0ddd2" /><rect width="2" height="5" fill="#91472c" /></pattern>
          </defs>

          {airMarkers.map((x, index) => {
            const isHighlighted = index === 3;
            const markerX = x + (activeMarkerOffsets?.[index] ?? 0);
            return <g key={x} aria-hidden="true">
              <line x1={x} y1="76" x2={x} y2="126" stroke="#D0D5DD" strokeDasharray="2 3" />
              <circle cx={markerX} cy="101" r="6" fill={isHighlighted ? 'url(#tracked-air-pattern)' : '#98A2B3'} stroke={isHighlighted ? '#51291d' : '#667085'} strokeWidth="2" />
              {isHighlighted && <><path d={`M ${x - 11} 119 H ${x + 11}`} stroke="#91472c" strokeWidth="2" markerEnd="url(#smallarrow)" /><text x={x} y="143" textAnchor="middle" fill="#783923" fontSize="9">ця ділянка рухається поруч</text></>}
            </g>;
          })}
          <defs><marker id="smallarrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#91472c" /></marker></defs>

          {frontIndex >= 0 && <g aria-hidden="true"><rect x={wavefrontX - 15} y="65" width="30" height="72" rx="14" fill="#f0ddd2" fillOpacity="0.45" stroke="#91472c" strokeWidth="2" /><text x={wavefrontX} y="156" textAnchor="middle" fill="#783923" fontSize="9">{frontIndex < 3 ? 'стиснення' : 'зміна'}</text></g>}
          {rarefactionX !== undefined && <g aria-hidden="true"><path d={`M ${rarefactionX - 11} 130 V 136 H ${rarefactionX + 11} V 130`} fill="none" stroke="#667085" strokeDasharray="2 2" /><text x={rarefactionX} y="174" textAnchor="middle" fill="#475467" fontSize="9">розрідження</text></g>}

          <path d="M 314 72 C 337 66 348 81 337 94 C 329 103 330 117 315 124 C 300 119 299 79 314 72 Z" fill="#fcf9f7" stroke="#783923" strokeWidth="3" />
          <line x1={319 + eardrumOffset} y1="84" x2={319 + eardrumOffset} y2="113" stroke="#91472c" strokeWidth="4" strokeLinecap="round" />
          {displayedFrame === 6 && <text x="319" y="146" textAnchor="middle" fill="#783923" fontSize="9">вухо отримало зміну</text>}
          </g>
        </svg>
        <div className="border-t border-gray-200 px-4 py-3 text-sm leading-6 text-gray-700" role="status" aria-live="polite" aria-atomic="true">
          {staticMode && <span className="font-semibold text-gray-950">Кадр {staticFrameIndex + 1} із {staticFrameMap.length}. </span>}{status}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {staticMode ? <>
          <button type="button" disabled={staticFrameIndex === 0} onClick={() => setStaticFrameIndex((current) => Math.max(0, current - 1))} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Назад</button>
          <button type="button" disabled={staticReviewed} onClick={nextStaticFrame} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-default disabled:bg-success-600 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{staticReviewed ? 'Кадри переглянуто' : staticFrameIndex === staticFrameMap.length - 1 ? 'Завершити перегляд' : 'Далі'}</button>
        </> : <>
          <button type="button" onClick={() => playback === 'playing' ? setPlayback('paused') : play()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
            {playback === 'playing' ? <PauseCircle className="size-4" /> : <Play className="size-4" />}{playback === 'playing' ? 'Пауза' : playback === 'paused' ? 'Продовжити' : 'Відтворити'}
          </button>
          <button type="button" onClick={replay} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><RefreshCw01 className="size-4" />Повторити</button>
          <button type="button" disabled={frame < 3 || sourceStopped || playback === 'finished'} onClick={stopSource} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><StopCircle className="size-4" />Зупинити струну</button>
        </>}
      </div>
      {sourceStopped && playback !== 'finished' && <p className="mt-3 text-sm leading-6 text-gray-600">Нові зміни більше не виникають, але вже створена зміна продовжує шлях до вуха.</p>}

      <details className="mt-6 rounded-lg border border-gray-200 bg-white p-4" open={staticMode}>
        <summary className="cursor-pointer font-semibold text-gray-950">Текстова транскрипція: чотири фази моделі</summary>
        <p className="mt-3 text-sm leading-6 text-gray-600">Цей опис передає весь причинний шлях без анімації та без аудіо.</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {content.staticFrames.map((item, index) => <li key={item.title} className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700"><p className="font-semibold text-gray-950">{index + 1}. {item.title}</p><p className="mt-1">{item.description}</p></li>)}
        </ol>
        {!staticMode && <button type="button" disabled={staticReviewed} onClick={finishStaticReview} className="mt-4 min-h-11 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-default disabled:bg-success-600 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{staticReviewed ? 'Транскрипцію переглянуто' : 'Я прочитав/ла транскрипцію'}</button>}
      </details>
    </div>}

    {modelObserved && <div className="border-t border-gray-200 pt-7">
      <ChoiceQuestion question={content.observationQuestion} choices={content.observationChoices} correctChoiceId="change" onCheck={(_, isCorrect) => { setObservationAttempts((current) => current + 1); if (isCorrect) setObservationAnswered(true); }} />
      {(observationAnswered || observationAttempts >= 2) && <div className="mt-5 rounded-lg bg-brand-25 p-5 text-sm leading-6 text-gray-700"><p className="font-semibold text-gray-950">Відкриття: звукова хвиля</p><p className="mt-2">{content.reveal}</p></div>}
    </div>}
  </div>;
}
