import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { motionFrames } from '@/components/lesson/virtual-guitar-string/constants';
import { useVirtualGuitarString } from '@/components/lesson/virtual-guitar-string/hooks/use-virtual-guitar-string';
import type { VirtualGuitarStringProps } from '@/components/lesson/virtual-guitar-string/types';
import { PauseCircle, Play, RefreshCw01, StopCircle } from '@untitledui/icons';

export function VirtualGuitarString({ observationChoices, predictionChoices, audioEnabled, staticMode, onAudioEnabledChange, onExperimentComplete }: VirtualGuitarStringProps) {
  const { stringState, hasPlucked, predictionMade, setPredictionMade, predictionId, setPredictionId, slow, frameIndex, observationAttempts, setObservationAttempts, audioStatus, gestureStarted, offset, isStopAvailable, predictionLabel, visualDescription, statusText, stopGuidance, toggleAudio, pluck, stop, togglePlayback, toggleSpeed, nextFrame, previousFrame } = useVirtualGuitarString({ predictionChoices, audioEnabled, staticMode, onAudioEnabledChange, onExperimentComplete });
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
