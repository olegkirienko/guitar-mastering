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

// Screen 3: reveal the names one row at a time, then check discrete changes.
export function FrequencyPitchLab({ content, audio, onComplete }: FrequencyPitchLabProps) {
  const [revealed, setRevealed] = useState(0);
  const [frequency, setFrequency] = useState<LabFrequency>(220);
  const [baseline, setBaseline] = useState<LabFrequency>(220);
  const [prediction, setPrediction] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [checkedOnce, setCheckedOnce] = useState(false);
  const reported = useRef(false);
  const sliderId = useId();
  const predictionName = useId();
  const allRevealed = revealed >= content.rows.length;
  const changed = frequency !== baseline;

  useEffect(() => {
    if (!allRevealed || !checkedOnce || reported.current) return;
    reported.current = true;
    onComplete();
  }, [allRevealed, checkedOnce, onComplete]);

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
  };

  return <div className="space-y-6">
    <section aria-labelledby="discovery-card-title" className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 id="discovery-card-title" className="sr-only">{content.cardTitle}</h3>
      <div className="hidden grid-cols-[1fr_auto_1fr] gap-x-3 text-sm sm:grid">
        <p className="font-semibold text-gray-950">{content.happensTitle}</p>
        <span aria-hidden="true" />
        <p className="font-semibold text-gray-950">{content.perceiveTitle}</p>
      </div>
      <ol className="mt-3 space-y-3 text-sm">
        {content.rows.slice(0, revealed).map((row) => <li key={row.happens} className="grid gap-1 rounded-md bg-gray-50 p-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:bg-transparent sm:p-0">
          <p className="text-gray-700"><span className="font-semibold text-gray-950 sm:sr-only">{content.happensTitle}: </span>{row.happens}</p>
          <ArrowRight className="size-4 rotate-90 text-gray-400 sm:mt-0.5 sm:rotate-0" aria-hidden="true" />
          <p className="text-gray-700"><span className="font-semibold text-gray-950 sm:sr-only">{content.perceiveTitle}: </span>{row.perceive}</p>
        </li>)}
      </ol>
      {!allRevealed && <button type="button" onClick={() => setRevealed((count) => count + 1)} className="mt-4 min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.revealLabel}</button>}
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
            <button type="button" disabled={frequency === labFrequencies[0]} onClick={() => change(stepFrequency(frequency, -1))} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.lowerLabel}</button>
            <button type="button" disabled={frequency === labFrequencies[labFrequencies.length - 1]} onClick={() => change(stepFrequency(frequency, 1))} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.higherLabel}</button>
          </div>
        </div>
        <div className="mt-3"><RepeatDensityTrack frequency={frequency} /></div>
        {audio.enabled && <button type="button" onClick={() => audio.playTone(frequency, toneGain[frequency])} className="mt-3 min-h-11 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-25 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.listenLabel}</button>}
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
