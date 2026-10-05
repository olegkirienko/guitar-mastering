import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { Button } from '@/components/base/buttons/button';
import { PredictionMiniScheme } from '@/components/lesson/sound-propagation-lab/components/prediction-mini-scheme/prediction-mini-scheme';
import { airMarkers, staticFrameMap } from '@/components/lesson/sound-propagation-lab/constants';
import { useSoundPropagationLab } from '@/components/lesson/sound-propagation-lab/hooks/use-sound-propagation-lab';
import type { SoundPropagationLabProps } from '@/components/lesson/sound-propagation-lab/types';
import { PauseCircle, Play, RefreshCw01, StopCircle } from '@untitledui/icons';

export function SoundPropagationLab({ content, staticMode, onComplete }: SoundPropagationLabProps) {
  const { predictionGroupId, predictionId, setPredictionId, predictionChecked, setPredictionChecked, predictionMade, setPredictionMade, playback, setPlayback, frame, sourceStopped, observationAnswered, setObservationAnswered, observationAttempts, setObservationAttempts, staticReviewed, staticFrameIndex, setStaticFrameIndex, displayedFrame, frontIndex, wavefrontX, activeMarkerOffsets, rarefactionX, stringOffset, eardrumOffset, status, selectedPrediction, modelObserved, play, replay, stopSource, finishStaticReview, nextStaticFrame } = useSoundPropagationLab({ content, staticMode, onComplete });
  return <div className="space-y-7">
    <fieldset className="space-y-4" aria-describedby={predictionChecked ? `${predictionGroupId}-feedback` : undefined}>
      <legend className="text-lg font-semibold text-primary">{content.predictionQuestion}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {content.predictionChoices.map((choice) => <label key={choice.id} className="flex cursor-pointer flex-col rounded-lg border border-secondary p-4 text-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-solid has-[:focus-visible]:ring-offset-2 last:sm:col-span-2">
          <span className="flex items-start gap-3"><input type="radio" name={predictionGroupId} value={choice.id} checked={predictionId === choice.id} onChange={() => { setPredictionId(choice.id); setPredictionChecked(false); }} className="mt-1 size-4 accent-fg-brand-primary" /><span>{choice.label}</span></span>
          {(choice.id === 'same-air' || choice.id === 'change') && <PredictionMiniScheme model={choice.id} />}
        </label>)}
      </div>
      <Button size="lg" isDisabled={!predictionId} onClick={() => { setPredictionChecked(true); setPredictionMade(true); }}>Зберегти прогноз</Button>
      {predictionChecked && selectedPrediction && <div id={`${predictionGroupId}-feedback`} role="status" className="rounded-lg bg-secondary p-4 text-sm leading-6 text-secondary"><p><strong>Прогноз збережено.</strong> {selectedPrediction.feedback}</p></div>}
    </fieldset>

    {predictionMade && <div className="rounded-xl border border-secondary bg-secondary p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-primary">Лабораторія поширення звуку</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-tertiary">Рух сильно сповільнено й збільшено, щоб його було видно. Стеж за смугастою ділянкою повітря та за контуром зміни.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-utility-brand-100 px-3 py-1 text-xs font-semibold text-utility-brand-800">якісна модель</span>
          {staticMode && <span className="rounded-full bg-quaternary px-3 py-1 text-xs font-semibold text-secondary">покадровий режим</span>}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-utility-brand-200 bg-primary">
        <svg viewBox="0 0 360 190" className="h-auto min-w-[560px] w-full" role="img" focusable="false" aria-labelledby="propagation-title propagation-description">
          <title id="propagation-title">Струна, корпус гітари, ділянки повітря та вухо</title>
          <desc id="propagation-description">{status}</desc>
          <g aria-hidden="true">
          <rect x="0" y="0" width="360" height="190" fill="#fff" />
          <text className="fill-fg-tertiary" x="42" y="24" textAnchor="middle" fontSize="11">струна й корпус</text>
          <text className="fill-fg-tertiary" x="178" y="24" textAnchor="middle" fontSize="11">малі ділянки повітря</text>
          <text className="fill-fg-tertiary" x="323" y="24" textAnchor="middle" fontSize="11">вухо</text>

          <path className="fill-utility-brand-100 stroke-utility-brand-700" d="M 61 52 Q 87 95 61 138 L 42 138 L 42 52 Z" transform={displayedFrame === 2 && !sourceStopped ? 'translate(3 0)' : undefined} strokeWidth="3" />
          <line className="stroke-fg-brand-primary" x1="25" y1="95" x2="62" y2={95 + stringOffset} strokeWidth="4" strokeLinecap="round" />
          <line className="stroke-fg-quaternary" x1="25" y1="95" x2="62" y2="95" strokeDasharray="3 3" />

          <line className="stroke-fg-tertiary" x1="94" y1="46" x2="276" y2="46" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
          <text className="fill-fg-tertiary" x="185" y="40" textAnchor="middle" fontSize="10">зміна передається далі</text>
          <defs>
            <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path className="fill-fg-tertiary" d="M0,0 L7,3.5 L0,7 Z" /></marker>
            <pattern id="tracked-air-pattern" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect className="fill-utility-brand-100" width="5" height="5" /><rect className="fill-fg-brand-primary" width="2" height="5" /></pattern>
          </defs>

          {airMarkers.map((x, index) => {
            const isHighlighted = index === 3;
            const markerX = x + (activeMarkerOffsets?.[index] ?? 0);
            return <g key={x} aria-hidden="true">
              <line className="stroke-border-primary" x1={x} y1="76" x2={x} y2="126" strokeDasharray="2 3" />
              <circle cx={markerX} cy="101" r="6" fill={isHighlighted ? 'url(#tracked-air-pattern)' : undefined} className={isHighlighted ? 'stroke-utility-brand-900' : 'fill-fg-quaternary stroke-text-quaternary'} strokeWidth="2" />
              {isHighlighted && <><path className="stroke-fg-brand-primary" d={`M ${x - 11} 119 H ${x + 11}`} strokeWidth="2" markerEnd="url(#smallarrow)" /><text className="fill-utility-brand-700" x={x} y="143" textAnchor="middle" fontSize="9">ця ділянка рухається поруч</text></>}
            </g>;
          })}
          <defs><marker id="smallarrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path className="fill-fg-brand-primary" d="M0,0 L5,2.5 L0,5 Z" /></marker></defs>

          {frontIndex >= 0 && <g aria-hidden="true"><rect className="fill-utility-brand-100 stroke-fg-brand-primary" x={wavefrontX - 15} y="65" width="30" height="72" rx="14" fillOpacity="0.45" strokeWidth="2" /><text className="fill-utility-brand-700" x={wavefrontX} y="156" textAnchor="middle" fontSize="9">{frontIndex < 3 ? 'стиснення' : 'зміна'}</text></g>}
          {rarefactionX !== undefined && <g aria-hidden="true"><path className="stroke-text-quaternary" d={`M ${rarefactionX - 11} 130 V 136 H ${rarefactionX + 11} V 130`} fill="none" strokeDasharray="2 2" /><text className="fill-fg-tertiary" x={rarefactionX} y="174" textAnchor="middle" fontSize="9">розрідження</text></g>}

          <path className="fill-bg-brand-primary_alt stroke-utility-brand-700" d="M 314 72 C 337 66 348 81 337 94 C 329 103 330 117 315 124 C 300 119 299 79 314 72 Z" strokeWidth="3" />
          <line className="stroke-fg-brand-primary" x1={319 + eardrumOffset} y1="84" x2={319 + eardrumOffset} y2="113" strokeWidth="4" strokeLinecap="round" />
          {displayedFrame === 6 && <text className="fill-utility-brand-700" x="319" y="146" textAnchor="middle" fontSize="9">вухо отримало зміну</text>}
          </g>
        </svg>
        <div className="border-t border-secondary px-4 py-3 text-sm leading-6 text-secondary" role="status" aria-live="polite" aria-atomic="true">
          {staticMode && <span className="font-semibold text-primary">Кадр {staticFrameIndex + 1} із {staticFrameMap.length}. </span>}{status}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {staticMode ? <>
          <Button color="secondary" size="lg" isDisabled={staticFrameIndex === 0} onClick={() => setStaticFrameIndex((current) => Math.max(0, current - 1))}>Назад</Button>
          <Button size="lg" isDisabled={staticReviewed} onClick={nextStaticFrame}>{staticReviewed ? 'Кадри переглянуто' : staticFrameIndex === staticFrameMap.length - 1 ? 'Завершити перегляд' : 'Далі'}</Button>
        </> : <>
          <Button size="lg" iconLeading={playback === 'playing' ? PauseCircle : Play} onClick={() => playback === 'playing' ? setPlayback('paused') : play()}>{playback === 'playing' ? 'Пауза' : playback === 'paused' ? 'Продовжити' : 'Відтворити'}</Button>
          <Button color="secondary" size="lg" iconLeading={RefreshCw01} onClick={replay}>Повторити</Button>
          <Button color="secondary" size="lg" iconLeading={StopCircle} isDisabled={frame < 3 || sourceStopped || playback === 'finished'} onClick={stopSource}>Зупинити струну</Button>
        </>}
      </div>
      {sourceStopped && playback !== 'finished' && <p className="mt-3 text-sm leading-6 text-tertiary">Нові зміни більше не виникають, але вже створена зміна продовжує шлях до вуха.</p>}

      <details className="mt-6 rounded-lg border border-secondary bg-primary p-4" open={staticMode}>
        <summary className="cursor-pointer font-semibold text-primary">Текстова транскрипція: чотири фази моделі</summary>
        <p className="mt-3 text-sm leading-6 text-tertiary">Цей опис передає весь причинний шлях без анімації та без аудіо.</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {content.staticFrames.map((item, index) => <li key={item.title} className="rounded-lg bg-secondary p-4 text-sm leading-6 text-secondary"><p className="font-semibold text-primary">{index + 1}. {item.title}</p><p className="mt-1">{item.description}</p></li>)}
        </ol>
        {!staticMode && <Button size="lg" className="mt-4" isDisabled={staticReviewed} onClick={finishStaticReview}>{staticReviewed ? 'Транскрипцію переглянуто' : 'Я прочитав/ла транскрипцію'}</Button>}
      </details>
    </div>}

    {modelObserved && <div className="border-t border-secondary pt-7">
      <ChoiceQuestion question={content.observationQuestion} choices={content.observationChoices} correctChoiceId="change" onCheck={(_, isCorrect) => { setObservationAttempts((current) => current + 1); if (isCorrect) setObservationAnswered(true); }} />
      {(observationAnswered || observationAttempts >= 2) && <div className="mt-5 rounded-lg bg-brand-primary_alt p-5 text-sm leading-6 text-secondary"><p className="font-semibold text-primary">Відкриття: звукова хвиля</p><p className="mt-2">{content.reveal}</p></div>}
    </div>}
  </div>;
}
