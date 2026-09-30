import { ArrowRight } from '@untitledui/icons';
import { useEffect, useId, useRef, useState } from 'react';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import type { LessonTwoAudio } from '@/components/lesson/useLessonTwoAudio';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02';
import {
  labFeedback,
  labFrequencies,
  stepFrequency,
  toneGain,
  visualCycles,
  type LabFrequency,
} from '@/data/lessons/stage-01-lesson-02-model';

type FrequencyContent = typeof lessonTwoContent.frequency;

interface FrequencyPitchLabProps {
  content: FrequencyContent;
  audio: LessonTwoAudio;
  onComplete: () => void;
}

const stepperButton = 'min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';

// Schematic repeats: density follows the value, the line height never changes.
export function RepeatDensityTrack({ frequency }: { frequency: LabFrequency }) {
  const cycles = visualCycles(frequency);
  const points = Array.from({ length: 161 }, (_, index) => {
    const x = (index / 160) * 300 + 10;
    const y = 24 - Math.sin((index / 160) * cycles * 2 * Math.PI) * 14;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return <svg viewBox="0 0 320 48" className="h-auto w-full max-w-md" aria-hidden="true">
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600" />
  </svg>;
}

// Screen 3: reveal the names one item at a time, then check discrete changes.
export function FrequencyPitchLab({ content, audio, onComplete }: FrequencyPitchLabProps) {
  const [revealed, setRevealed] = useState(0);
  const [frequency, setFrequency] = useState<LabFrequency>(220);
  const [baseline, setBaseline] = useState<LabFrequency>(220);
  const [prediction, setPrediction] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [checkedOnce, setCheckedOnce] = useState(false);
  const [focusTarget, setFocusTarget] = useState<'card' | 'slider' | null>(null);
  const reported = useRef(false);
  const card = useRef<HTMLElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const sliderId = useId();
  const predictionName = useId();
  const total = content.revealItems.length;
  const allRevealed = revealed >= total;
  const changed = frequency !== baseline;
  const atLowest = frequency === labFrequencies[0];
  const atHighest = frequency === labFrequencies[labFrequencies.length - 1];

  useEffect(() => {
    if (!allRevealed || !checkedOnce || reported.current) return;
    reported.current = true;
    onComplete();
  }, [allRevealed, checkedOnce, onComplete]);

  // Controls that disappear hand focus to the next place to continue from.
  useEffect(() => {
    if (focusTarget === 'card') card.current?.focus();
    if (focusTarget === 'slider') slider.current?.focus();
    if (focusTarget) setFocusTarget(null);
  }, [focusTarget]);

  const reveal = () => {
    const next = Math.min(revealed + 1, total);
    setRevealed(next);
    if (next === total) setFocusTarget('card');
  };
  const change = (next: LabFrequency) => {
    setFrequency(next);
    setPrediction(undefined);
    setFeedback(undefined);
  };
  const check = () => {
    if (!changed || !prediction) return;
    setFeedback(labFeedback(baseline, frequency));
    setBaseline(frequency);
    setPrediction(undefined);
    setCheckedOnce(true);
    setFocusTarget('slider');
  };
  const itemsIn = (column: 'happens' | 'perceive') => content.revealItems
    .slice(0, revealed)
    .filter((item) => item.column === column);

  return <div className="space-y-6">
    <section ref={card} tabIndex={-1} aria-labelledby="discovery-card-title" className="rounded-lg border border-gray-200 bg-white p-5 outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
      <h3 id="discovery-card-title" className="sr-only">{content.cardTitle}</h3>
      <div className="grid gap-3 text-sm sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <p id="discovery-happens" className="font-semibold text-gray-950">{content.happensTitle}</p>
          <ul aria-labelledby="discovery-happens" className="mt-2 space-y-2 text-gray-700">
            {itemsIn('happens').map((item) => <li key={item.text}>{item.text}</li>)}
          </ul>
        </div>
        <ArrowRight className="size-5 rotate-90 text-gray-400 sm:mt-6 sm:rotate-0" aria-hidden="true" />
        <div>
          <p id="discovery-perceive" className="font-semibold text-gray-950">{content.perceiveTitle}</p>
          <ul aria-labelledby="discovery-perceive" className="mt-2 space-y-2 text-gray-700">
            {itemsIn('perceive').map((item) => <li key={item.text}>{item.text}</li>)}
          </ul>
        </div>
      </div>
      {allRevealed && <p className="mt-4 rounded-md bg-brand-25 p-3 text-sm font-semibold text-gray-950">{content.summary}</p>}
      {!allRevealed && <button type="button" onClick={reveal} className="mt-4 min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.revealLabel}</button>}
    </section>
    {allRevealed && <>
      <ChoiceQuestion question={content.countQuestion} choices={content.countChoices} correctChoiceId="vibrations" />
      <section aria-labelledby="frequency-lab-title" className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 id="frequency-lab-title" className="font-semibold text-gray-950">{content.labTitle}</h3>
        <p className="mt-1 text-sm text-gray-600">{content.labNote}</p>
        <div className="mt-4 grid max-w-md gap-3">
          <output htmlFor={sliderId} className="text-lg font-semibold text-gray-950">{frequency} Гц</output>
          <label htmlFor={sliderId} className="sr-only">{content.sliderLabel}</label>
          <input
            ref={slider}
            id={sliderId}
            type="range"
            min={0}
            max={labFrequencies.length - 1}
            step={1}
            value={labFrequencies.indexOf(frequency)}
            aria-valuetext={`${frequency} Гц`}
            onChange={(event) => change(labFrequencies[Number(event.target.value)])}
            className="h-11 w-full accent-brand-600"
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-disabled={atLowest} onClick={() => { if (!atLowest) change(stepFrequency(frequency, -1)); }} className={stepperButton}>{content.lowerLabel}</button>
            <button type="button" aria-disabled={atHighest} onClick={() => { if (!atHighest) change(stepFrequency(frequency, 1)); }} className={stepperButton}>{content.higherLabel}</button>
          </div>
        </div>
        <div className="mt-3"><RepeatDensityTrack frequency={frequency} /></div>
        {audio.enabled && !changed && <button type="button" onClick={() => audio.playTone(frequency, toneGain[frequency])} className="mt-3 min-h-11 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-25 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.listenLabel}</button>}
        {changed ? <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-semibold text-gray-950">{content.predictionLegend}</legend>
          <div className="flex flex-wrap gap-2">
            {content.predictionChoices.map((choice) => <label key={choice.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:focus-visible]:ring-offset-2">
              <input type="radio" name={predictionName} value={choice.id} checked={prediction === choice.id} onChange={() => setPrediction(choice.id)} className="size-4 accent-brand-600" />
              {choice.label}
            </label>)}
          </div>
          <button type="button" disabled={!prediction} onClick={check} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.checkLabel}</button>
        </fieldset> : !feedback && <p className="mt-4 text-sm text-gray-600">{content.changeFirst}</p>}
        <div role="status" data-testid="lab-feedback" className="mt-3 text-sm text-gray-700">{feedback && <p>{feedback}</p>}</div>
      </section>
    </>}
  </div>;
}
