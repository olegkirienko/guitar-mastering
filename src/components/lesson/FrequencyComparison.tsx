import { useEffect, useRef, useState } from 'react';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import type { LessonTwoAudio } from '@/components/lesson/useLessonTwoAudio';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02';
import {
  comparisonDurationMs,
  comparisonMoments,
  comparisonRepeats,
  completedRepeats,
  momentFraction,
  toneGain,
  trackOffset,
} from '@/data/lessons/stage-01-lesson-02-model';

type RepeatsContent = typeof lessonTwoContent.repeats;

interface FrequencyComparisonProps {
  content: RepeatsContent;
  staticMode: boolean;
  audio: LessonTwoAudio;
  onComplete: () => void;
}

function Track({ label, offset }: { label: string; offset: number }) {
  return <div>
    <p className="text-sm font-medium text-gray-950">{label}</p>
    <div className="relative mt-1 h-8 rounded-md bg-gray-100" aria-hidden="true">
      <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600" style={{ left: `${50 + offset * 40}%` }} />
    </div>
  </div>;
}

// Screen 2: two tracks on one shared timer, 4 versus 8 full repeats.
export function FrequencyComparison({ content, staticMode, audio, onComplete }: FrequencyComparisonProps) {
  const [predicted, setPredicted] = useState(false);
  const [fraction, setFraction] = useState(0);
  const [running, setRunning] = useState(false);
  const [resultShown, setResultShown] = useState(false);
  const frame = useRef<number>(undefined);
  const finished = fraction >= 1;
  const moment = Math.round(fraction * comparisonMoments);

  useEffect(() => () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
  }, []);

  useEffect(() => {
    if (staticMode && running) {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
      setRunning(false);
    }
  }, [running, staticMode]);

  const reported = useRef(false);
  useEffect(() => {
    if (!predicted || !finished || reported.current) return;
    reported.current = true;
    onComplete();
  }, [finished, onComplete, predicted]);

  const run = () => {
    setFraction(0);
    setRunning(true);
    const startedAt = performance.now();
    const tick = (now: number) => {
      const next = Math.min((now - startedAt) / comparisonDurationMs, 1);
      setFraction(next);
      if (next < 1) frame.current = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const countA = completedRepeats(comparisonRepeats.a, fraction);
  const countB = completedRepeats(comparisonRepeats.b, fraction);

  return <div className="space-y-6">
    <ChoiceQuestion
      question={content.predictionQuestion}
      choices={content.predictionChoices}
      correctChoiceId="b"
      mode="prediction"
      onCheck={() => setPredicted(true)}
    />
    {predicted && <section aria-labelledby="repeats-lab-title" className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 id="repeats-lab-title" className="font-semibold text-gray-950">{content.summaryCaption}</h3>
      <p className="mt-1 text-sm text-gray-600">{content.modelNote}</p>
      <div className="mt-4 space-y-3">
        <Track label={content.trackA} offset={trackOffset(comparisonRepeats.a, fraction)} />
        <Track label={content.trackB} offset={trackOffset(comparisonRepeats.b, fraction)} />
        <div>
          <p className="text-sm text-gray-600">{content.timerLabel}</p>
          <div className="mt-1 h-2 rounded-full bg-gray-100" aria-hidden="true">
            <div className="h-2 rounded-full bg-gray-500" style={{ width: `${fraction * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {staticMode ? <>
          <button type="button" disabled={finished} onClick={() => setFraction(momentFraction(moment + 1))} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.nextMomentLabel}</button>
          <button type="button" disabled={finished} onClick={() => setFraction(1)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.showSummaryLabel}</button>
        </> : <button type="button" disabled={running} onClick={run} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{finished ? content.rerunLabel : content.runLabel}</button>}
      </div>
      <table className="mt-4 w-full text-left text-sm text-gray-700">
        <caption className="sr-only">{content.summaryCaption}</caption>
        <thead><tr><th scope="col" className="py-1 font-medium">{content.trackA}</th><th scope="col" className="py-1 font-medium">{content.trackB}</th></tr></thead>
        <tbody><tr><td className="py-1">{countA}</td><td className="py-1">{countB}</td></tr></tbody>
      </table>
      <div aria-live="polite" className="mt-3 text-sm text-gray-700">
        {finished && <p>{`A: ${countA} повтори; B: ${countB} повторів; час однаковий.`} {content.countFeedback}</p>}
      </div>
    </section>}
    {predicted && finished && <div className="space-y-4">
      <ChoiceQuestion
        question={content.soundQuestion}
        choices={content.soundChoices}
        correctChoiceId="higher"
        mode="prediction"
        onCheck={() => undefined}
      />
      <button type="button" onClick={() => setResultShown(true)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.showResultLabel}</button>
      {audio.enabled && <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => audio.playTone(220, toneGain[220])} className="min-h-11 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-25 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.listenA}</button>
        <button type="button" onClick={() => audio.playTone(440, toneGain[440])} className="min-h-11 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-25 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{content.listenB}</button>
      </div>}
      <div aria-live="polite" className="text-sm text-gray-700">
        {resultShown && <p><strong className="font-semibold text-gray-950">{content.result}</strong> {content.resultFeedback}</p>}
      </div>
    </div>}
  </div>;
}
