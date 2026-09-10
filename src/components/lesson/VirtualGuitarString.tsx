import { PauseCircle, Play, RefreshCw01, StopCircle } from '@untitledui/icons';
import { useEffect, useRef, useState } from 'react';
import { ChoiceQuestion, type ChoiceQuestionChoice } from '@/components/lesson/ChoiceQuestion';

type StringState = 'rest' | 'playing' | 'paused' | 'stopped';
type AudioStatus = 'idle' | 'ready' | 'blocked' | 'unavailable';

interface VirtualGuitarStringProps {
  observationChoices: readonly ChoiceQuestionChoice[];
  predictionChoices: readonly ChoiceQuestionChoice[];
  audioEnabled: boolean;
  staticMode: boolean;
  onAudioEnabledChange: (enabled: boolean) => void;
  onExperimentComplete: () => void;
}

const motionFrames = [
  { offset: -30, label: 'Струна відхилилася в один бік.' },
  { offset: 0, label: 'Струна знову проходить через середину.' },
  { offset: 30, label: 'Струна відхилилася в інший бік.' },
] as const;

export function VirtualGuitarString({ observationChoices, predictionChoices, audioEnabled, staticMode, onAudioEnabledChange, onExperimentComplete }: VirtualGuitarStringProps) {
  const [stringState, setStringState] = useState<StringState>('rest');
  const [elapsed, setElapsed] = useState(0);
  const [hasPlucked, setHasPlucked] = useState(false);
  const [predictionMade, setPredictionMade] = useState(false);
  const [predictionId, setPredictionId] = useState<string>();
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [slow, setSlow] = useState(false);
  const [frameIndex, setFrameIndex] = useState(motionFrames.length - 1);
  const [observationAttempts, setObservationAttempts] = useState(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const animationStart = useRef<number | undefined>(undefined);
  const animationFrame = useRef<number | undefined>(undefined);
  const gestureStarted = useRef(false);
  const audioContext = useRef<AudioContext | undefined>(undefined);
  const activeSource = useRef<AudioBufferSourceNode | undefined>(undefined);
  const activeGain = useRef<GainNode | undefined>(undefined);
  const audioRun = useRef(0);

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
    if (staticMode) setStringState((current) => current === 'playing' ? 'paused' : current);
  }, [staticMode]);

  useEffect(() => () => {
    audioRun.current += 1;
    activeSource.current?.stop();
    void audioContext.current?.close();
  }, []);

  useEffect(() => {
    const pauseForHiddenDocument = () => {
      if (document.hidden) {
        if (stringState === 'playing') setStringState('paused');
        stopAudio();
      }
    };
    document.addEventListener('visibilitychange', pauseForHiddenDocument);
    return () => document.removeEventListener('visibilitychange', pauseForHiddenDocument);
  }, [stringState]);

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

  function stopAudio(fadeDuration = 0.08) {
    audioRun.current += 1;
    const gain = activeGain.current;
    const source = activeSource.current;
    const context = audioContext.current;
    if (!gain || !source || !context) return;

    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, fadeDuration / 3);
    source.stop(now + fadeDuration * 6);
    activeGain.current = undefined;
    activeSource.current = undefined;
  }

  function getAudioContext() {
    if (audioContext.current && audioContext.current.state !== 'closed') return audioContext.current;
    if (!window.AudioContext) {
      setAudioStatus('unavailable');
      return undefined;
    }
    try {
      audioContext.current = new window.AudioContext();
      return audioContext.current;
    } catch {
      setAudioStatus('unavailable');
      return undefined;
    }
  }

  async function enableAudio() {
    const context = getAudioContext();
    if (!context) return;
    try {
      await context.resume();
      onAudioEnabledChange(true);
      setAudioStatus('ready');
    } catch {
      onAudioEnabledChange(false);
      setAudioStatus('blocked');
    }
  }

  function createPluckedStringBuffer(context: AudioContext) {
    const duration = 1.25;
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    const delayLength = Math.max(2, Math.round(context.sampleRate / 110));
    const delay = new Float32Array(delayLength);
    let seed = 0x5f3759df;
    for (let index = 0; index < delayLength; index += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      delay[index] = ((seed / 0xffffffff) * 2 - 1) * (1 - index / delayLength * 0.35);
    }
    let cursor = 0;
    let previous = 0;
    for (let index = 0; index < length; index += 1) {
      const current = delay[cursor];
      const next = (current + previous) * 0.498;
      delay[cursor] = next;
      previous = current;
      cursor = (cursor + 1) % delayLength;
      samples[index] = current * Math.exp(-index / context.sampleRate * 2.3);
    }
    return buffer;
  }

  async function startAudio() {
    if (!audioEnabled) return;
    stopAudio(0.03);
    const run = audioRun.current;
    const context = getAudioContext();
    if (!context) return;
    try {
      if (context.state === 'suspended') await context.resume();
      if (audioRun.current !== run) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      const now = context.currentTime;
      source.buffer = createPluckedStringBuffer(context);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
      gain.gain.setTargetAtTime(0.0001, now + 0.18, 0.22);
      source.connect(gain).connect(context.destination);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (activeSource.current === source) {
          activeSource.current = undefined;
          activeGain.current = undefined;
        }
      };
      activeSource.current = source;
      activeGain.current = gain;
      source.start(now);
      source.stop(now + 1.25);
    } catch {
      onAudioEnabledChange(false);
      setAudioStatus('blocked');
    }
  }

  function toggleAudio() {
    if (!audioEnabled) {
      void enableAudio();
      return;
    }
    onAudioEnabledChange(false);
    stopAudio();
  }

  function pluck() {
    setHasPlucked(true);
    setElapsed(0);
    setFrameIndex(1);
    setStringState(staticMode ? 'paused' : 'playing');
    if (predictionMade) setExperimentStarted(true);
    void startAudio();
  }

  function stop() {
    if (!isStopAvailable) return;
    setStringState('stopped');
    stopAudio();
    onExperimentComplete();
  }

  function togglePlayback() {
    if (stringState === 'playing') {
      setStringState('paused');
      stopAudio();
      return;
    }
    setStringState('playing');
    void startAudio();
  }

  function toggleSpeed() {
    const nextSlow = !slow;
    setSlow(nextSlow);
    setElapsed(0);
    if (stringState === 'playing') void startAudio();
  }

  function nextFrame() {
    const startsStaticExperiment = stringState !== 'paused';
    setHasPlucked(true);
    setFrameIndex((current) => (current + 1) % motionFrames.length);
    setStringState('paused');
    if (predictionMade) setExperimentStarted(true);
    if (startsStaticExperiment) void startAudio();
  }

  function previousFrame() {
    setHasPlucked(true);
    setFrameIndex((current) => (current - 1 + motionFrames.length) % motionFrames.length);
    setStringState('paused');
  }

  return <div className="space-y-7">
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-950">Віртуальна струна</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">Потягни її пальцем на сцені або скористайся кнопкою. Аудіо для цього досліду не потрібне.</p>
        </div>
        {staticMode && <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">покадровий режим</span>}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-brand-200 bg-white">
        <div
          className="touch-none select-none p-4 sm:p-8"
          onPointerDown={() => { gestureStarted.current = true; }}
          onPointerUp={() => { if (gestureStarted.current) { pluck(); gestureStarted.current = false; } }}
          onPointerCancel={() => { gestureStarted.current = false; }}
        >
          <svg viewBox="0 0 320 160" className="h-auto w-full" role="img" focusable="false" aria-labelledby="string-visual-title string-visual-description">
            <title id="string-visual-title">Струна між двома опорами</title>
            <desc id="string-visual-description">{visualDescription}</desc>
            <g aria-hidden="true">
              <rect x="20" y="66" width="16" height="28" rx="4" fill="#783923" />
              <rect x="284" y="66" width="16" height="28" rx="4" fill="#783923" />
              <line x1="36" y1="80" x2="284" y2="80" stroke="#98A2B3" strokeDasharray="5 5" strokeWidth="2" />
              <path d={`M 36 80 Q 160 ${80 + offset} 284 80`} fill="none" stroke="#91472c" strokeWidth="5" strokeLinecap="round" />
              <text x="160" y="138" textAnchor="middle" fill="#475467" fontSize="13">пунктир — звичне положення струни</text>
            </g>
          </svg>
        </div>
        <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-700" role="status" aria-live="polite" aria-atomic="true">
          {staticMode && hasPlucked && <span className="font-semibold text-gray-950">Кадр {frameIndex + 1} із {motionFrames.length}. </span>}{statusText}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div className="min-w-0 flex-1 text-sm leading-6 text-gray-600" aria-live="polite">
          {audioStatus === 'unavailable'
            ? 'Аудіо недоступне в цьому браузері. Візуальна модель працює повністю самостійно.'
            : audioStatus === 'blocked'
              ? 'Браузер не дозволив увімкнути аудіо. Спробуй ще раз або продовжуй із візуальною моделлю.'
              : audioEnabled
                ? 'Звук увімкнено. Він почнеться лише після щипка струни.'
                : 'Звук необов’язковий: візуальна модель і текст показують весь результат.'}
        </div>
        <button type="button" onClick={toggleAudio} aria-pressed={audioEnabled} className="min-h-11 shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          {audioEnabled ? 'Вимкнути звук' : audioStatus === 'blocked' ? 'Спробувати ввімкнути звук' : 'Увімкнути звук'}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {staticMode ? <>
          <button type="button" disabled={!hasPlucked} onClick={previousFrame} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Попередній кадр</button>
          <button type="button" onClick={nextFrame} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><Play className="size-4" />Наступний кадр</button>
        </> : <>
          <button type="button" onClick={pluck} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><Play className="size-4" />Смикнути</button>
          <button type="button" disabled={stringState !== 'playing' && stringState !== 'paused'} onClick={togglePlayback} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{stringState === 'playing' ? <PauseCircle className="size-4" /> : <Play className="size-4" />}{stringState === 'playing' ? 'Пауза' : 'Продовжити'}</button>
        </>}
        {!staticMode && <button type="button" onClick={toggleSpeed} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><RefreshCw01 className="size-4" />{slow ? 'Швидкість: повільно' : 'Швидкість: 1×'}</button>}
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
