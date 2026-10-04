import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { useFrequencyPitchLab } from '@/components/lesson/frequency-pitch-lab/hooks/use-frequency-pitch-lab';
import type { FrequencyPitchLabProps } from '@/components/lesson/frequency-pitch-lab/types';
import { RepeatDensityTrack } from '@/components/lesson/repeat-density-track/repeat-density-track';
import { labFrequencies, toneGain } from '@/data/lessons/stage-01-lesson-02-model/constants';
import { stepFrequency } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';
import { ArrowRight } from '@untitledui/icons';

// Screen 3: reveal the names one item at a time, then check discrete changes.
export function FrequencyPitchLab({ content, audio, onComplete }: FrequencyPitchLabProps) {
  const { frequency, prediction, setPrediction, feedback, card, slider, sliderId, predictionName, allRevealed, changed, atLowest, atHighest, reveal, change, check, itemsIn } = useFrequencyPitchLab({ content, onComplete });
  return <div className="space-y-6">
    <section ref={card} tabIndex={-1} aria-labelledby="discovery-card-title" className="rounded-lg border border-gray-200 bg-white p-5 outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
      <h3 id="discovery-card-title" className="sr-only">{content.cardTitle}</h3>
      <div className="grid gap-3 text-sm sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <p id="discovery-happens" className="font-semibold text-gray-950">{content.happensTitle}</p>
          {itemsIn('happens').length > 0 && <ul aria-labelledby="discovery-happens" className="mt-2 space-y-2 text-gray-700">
            {itemsIn('happens').map((item) => <li key={item.text}>{item.text}</li>)}
          </ul>}
        </div>
        <ArrowRight className="size-5 rotate-90 text-gray-400 sm:mt-6 sm:rotate-0" aria-hidden="true" />
        <div>
          <p id="discovery-perceive" className="font-semibold text-gray-950">{content.perceiveTitle}</p>
          {itemsIn('perceive').length > 0 && <ul aria-labelledby="discovery-perceive" className="mt-2 space-y-2 text-gray-700">
            {itemsIn('perceive').map((item) => <li key={item.text}>{item.text}</li>)}
          </ul>}
        </div>
      </div>
      {allRevealed && <p className="mt-4 rounded-md bg-brand-25 p-3 text-sm font-semibold text-gray-950">{content.summary}</p>}
      {!allRevealed && <Button size="lg" className="mt-4" onClick={reveal}>{content.revealLabel}</Button>}
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
            <Button color="secondary" size="lg" className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50" aria-disabled={atLowest} onClick={() => { if (!atLowest) change(stepFrequency(frequency, -1)); }}>{content.lowerLabel}</Button>
            <Button color="secondary" size="lg" className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50" aria-disabled={atHighest} onClick={() => { if (!atHighest) change(stepFrequency(frequency, 1)); }}>{content.higherLabel}</Button>
          </div>
        </div>
        <div className="mt-3"><RepeatDensityTrack frequency={frequency} /></div>
        {audio.enabled && !changed && <Button color="secondary" size="lg" className="mt-3" onClick={() => audio.playTone(frequency, toneGain[frequency])}>{content.listenLabel}</Button>}
        {changed ? <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-semibold text-gray-950">{content.predictionLegend}</legend>
          <div className="flex flex-wrap gap-2">
            {content.predictionChoices.map((choice) => <label key={choice.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:focus-visible]:ring-offset-2">
              <input type="radio" name={predictionName} value={choice.id} checked={prediction === choice.id} onChange={() => setPrediction(choice.id)} className="size-4 accent-brand-600" />
              {choice.label}
            </label>)}
          </div>
          <Button size="lg" isDisabled={!prediction} onClick={check}>{content.checkLabel}</Button>
        </fieldset> : !feedback && <p className="mt-4 text-sm text-gray-600">{content.changeFirst}</p>}
        <div role="status" data-testid="lab-feedback" className="mt-3 text-sm text-gray-700">{feedback && <p>{feedback}</p>}</div>
      </section>
    </>}
  </div>;
}
