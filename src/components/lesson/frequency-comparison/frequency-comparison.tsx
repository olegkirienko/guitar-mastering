import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { Track } from '@/components/lesson/frequency-comparison/components/track/track';
import { useFrequencyComparison } from '@/components/lesson/frequency-comparison/hooks/use-frequency-comparison';
import type { FrequencyComparisonProps } from '@/components/lesson/frequency-comparison/types';
import { comparisonRepeats, toneGain } from '@/data/lessons/stage-01-lesson-02-model/constants';
import { trackOffset } from '@/data/lessons/stage-01-lesson-02-model/utils/comparison-timing';

// Screen 2: two tracks on one shared timer, 4 versus 8 full repeats.
export function FrequencyComparison({ content, staticMode, audio, onComplete }: FrequencyComparisonProps) {
  const { predicted, setPredicted, fraction, running, resultShown, setResultShown, soundPredicted, setSoundPredicted, finished, run, nextMoment, showSummary, disabledLook, countA, countB } = useFrequencyComparison({ staticMode, onComplete });
  return <div className="space-y-6">
    <ChoiceQuestion
      question={content.predictionQuestion}
      choices={content.predictionChoices}
      correctChoiceId="b"
      mode="prediction"
      onCheck={() => setPredicted(true)}
    />
    {predicted && <section aria-labelledby="repeats-lab-title" className="rounded-lg border border-secondary bg-primary p-5">
      <h3 id="repeats-lab-title" className="font-semibold text-primary">{content.summaryCaption}</h3>
      <p className="mt-1 text-sm text-tertiary">{content.modelNote}</p>
      <div className="mt-4 space-y-3">
        <Track label={content.trackA} offset={trackOffset(comparisonRepeats.a, fraction)} />
        <Track label={content.trackB} offset={trackOffset(comparisonRepeats.b, fraction)} />
        <div>
          <p className="text-sm text-tertiary">{content.timerLabel}</p>
          <div className="mt-1 h-2 rounded-full bg-tertiary" aria-hidden="true">
            <div className="h-2 rounded-full bg-fg-quaternary" style={{ width: `${fraction * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {staticMode ? <>
          <Button size="lg" className={disabledLook} aria-disabled={finished} onClick={nextMoment}>{content.nextMomentLabel}</Button>
          <Button color="secondary" size="lg" className={disabledLook} aria-disabled={finished} onClick={showSummary}>{content.showSummaryLabel}</Button>
        </> : <Button size="lg" className={disabledLook} aria-disabled={running} onClick={run}>{finished ? content.rerunLabel : content.runLabel}</Button>}
      </div>
      <table className="mt-4 w-full text-left text-sm text-secondary">
        <caption className="sr-only">{content.summaryCaption}</caption>
        <thead><tr><th scope="col" className="py-1 font-medium">{content.trackA}</th><th scope="col" className="py-1 font-medium">{content.trackB}</th></tr></thead>
        <tbody><tr><td className="py-1">{countA}</td><td className="py-1">{countB}</td></tr></tbody>
      </table>
      <div aria-live="polite" className="mt-3 text-sm text-secondary">
        {finished && <p>{`A: ${countA} повтори; B: ${countB} повторів; час однаковий.`} {content.countFeedback}</p>}
      </div>
    </section>}
    {predicted && finished && <div className="space-y-4">
      <ChoiceQuestion
        question={content.soundQuestion}
        choices={content.soundChoices}
        correctChoiceId="higher"
        mode="prediction"
        onCheck={() => setSoundPredicted(true)}
      />
      {soundPredicted && <Button color="secondary" size="lg" onClick={() => setResultShown(true)}>{content.showResultLabel}</Button>}
      {soundPredicted && audio.enabled && <div className="flex flex-wrap gap-2">
        <Button color="secondary" size="lg" onClick={() => audio.playTone(220, toneGain[220])}>{content.listenA}</Button>
        <Button color="secondary" size="lg" onClick={() => audio.playTone(440, toneGain[440])}>{content.listenB}</Button>
      </div>}
      <div aria-live="polite" className="text-sm text-secondary">
        {resultShown && <p><strong className="font-semibold text-primary">{content.result}</strong> {content.resultFeedback}</p>}
      </div>
    </div>}
  </div>;
}
