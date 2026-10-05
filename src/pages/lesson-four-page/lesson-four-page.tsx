import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { StringHypotheses } from '@/components/lesson/string-hypotheses/string-hypotheses';
import { StringModesDiagram } from '@/components/lesson/string-modes-diagram/string-modes-diagram';
import { TimbreLab } from '@/components/lesson/timbre-lab/timbre-lab';
import { TimbreSoundComparison } from '@/components/lesson/timbre-sound-comparison/timbre-sound-comparison';
import { TimbreWave } from '@/components/lesson/timbre-wave/timbre-wave';
import { timbrePresets } from '@/data/lessons/stage-01-lesson-04-model/constants';
import { lessonFourContent } from '@/data/lessons/stage-01-lesson-04/constants';
import { stopByStep } from '@/pages/lesson-four-page/constants';
import { useLessonFourPage } from '@/pages/lesson-four-page/hooks/use-lesson-four-page';

export function LessonFourPage() {
  const { route, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, descriptions, toggleDescription, ownDescription, setOwnDescription, intro, shape, overtones, spectrum, preferences, waveWords, visibleStep, isCompleted, audio, goTo, toggleAudio, answerIntro, answerShapeCount, introOpen, shapeOpen, answerShapePrediction, overtonesOpen, answerOvertonesPrediction, overtonesSound, changeOvertonesSound, spectrumSound, changeSpectrumSound, spectrumNamed, answerSpectrum, isSpectrumAnswered, isSpectrumVerified, audioMessage } = useLessonFourPage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonFourContent} currentStop={stopByStep[visibleStep]} steps={route.steps} currentStepId={route.stepId}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    <div className="mb-5 grid gap-3 rounded-lg border border-secondary bg-secondary px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-sm leading-6 text-tertiary">
          <p className="font-semibold text-primary">{preferences.audioTitle}</p>
          <p>{preferences.audioNote}</p>
        </div>
        <Button color="secondary" size="lg" aria-pressed={audioEnabled} onClick={toggleAudio}>{audioEnabled ? preferences.audioOnLabel : preferences.audioOffLabel}</Button>
      </div>
      <div aria-live="polite" className="text-sm text-secondary">{audioMessage && <p>{audioMessage}</p>}</div>
    </div>

    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="space-y-6">
        <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{intro.note}</p>
        <TimbreSoundComparison content={intro.comparison} audio={audio} />
        <RealWorldExperiment title={intro.guitar.title} withGuitar={intro.guitar.withGuitar} withoutGuitar={intro.guitar.withoutGuitar} safetyNote={intro.guitar.safety} />
        <ChoiceQuestion question={intro.question.question} choices={intro.question.choices} correctChoiceId={intro.question.correctChoiceId} mode="prediction" onCheck={answerIntro} />
        {introOpen && <>
          <p className="rounded-lg bg-secondary p-4 font-medium text-primary">{intro.answer}</p>
          <StringHypotheses content={intro} selected={descriptions} onToggle={toggleDescription} own={ownDescription} onOwnChange={setOwnDescription} />
          <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('shape')}>{intro.startLabel}</Button>
        </>}
      </div>
    </LessonStep>}

    {visibleStep === 'shape' && <div className="space-y-5">
      <LessonStep title={shape.title} intro={shape.instruction} shouldFocus={focusedStep === 'shape'}>
        <div className="space-y-6">
          <ChoiceQuestion question={shape.prediction.question} choices={shape.prediction.choices} correctChoiceId={shape.prediction.correctChoiceId} mode="prediction" onCheck={answerShapePrediction} />
          {shapeOpen && <>
            <section aria-labelledby="shape-waves-title" className="space-y-5 rounded-lg border border-secondary bg-primary p-5">
              <div>
                <h3 id="shape-waves-title" className="font-semibold text-primary">{shape.wavesTitle}</h3>
                <p className="mt-1 text-sm text-tertiary">{shape.wavesNote}</p>
              </div>
              {intro.comparison.sounds.map((item) => <TimbreWave key={item.id} sound={item.sound} label={item.label} words={waveWords} />)}
            </section>
            <ChoiceQuestion question={shape.count.question} choices={shape.count.choices} correctChoiceId={shape.count.correctChoiceId} onCheck={answerShapeCount} />
          </>}
          {isCompleted('shape') && <div className="space-y-4">
            <p className="font-medium text-primary">{shape.pattern}</p>
            <section aria-labelledby="shape-term-title" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
              <h3 id="shape-term-title" className="font-semibold text-primary">{shape.termTitle}</h3>
              <p className="mt-2 text-secondary">{shape.term}</p>
            </section>
            <p className="text-lg font-medium text-primary">{shape.nextQuestion}</p>
          </div>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('intro')}>{shape.backLabel}</Button>
        {isCompleted('shape') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('overtones')}>{shape.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'overtones' && <div className="space-y-5">
      <LessonStep title={overtones.title} intro={overtones.instruction} shouldFocus={focusedStep === 'overtones'}>
        <div className="space-y-6">
          <ChoiceQuestion question={overtones.prediction.question} choices={overtones.prediction.choices} correctChoiceId={overtones.prediction.correctChoiceId} mode="prediction" onCheck={answerOvertonesPrediction} />
          {overtonesOpen && <TimbreLab mode="overtones" content={overtones.lab} words={waveWords} sound={overtonesSound} start={timbrePresets.pure} onChange={changeOvertonesSound} audio={audio} />}
          {isCompleted('overtones') && <div className="space-y-6">
            <section aria-labelledby="overtones-observation-title" className="space-y-3 rounded-lg border border-secondary bg-secondary p-5 text-secondary">
              <h3 id="overtones-observation-title" className="font-semibold text-primary">{overtones.observationTitle}</h3>
              <ul className="list-disc space-y-1 pl-5">{overtones.observations.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section aria-labelledby="overtones-term-title" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
              <h3 id="overtones-term-title" className="font-semibold text-primary">{overtones.termTitle}</h3>
              <p className="mt-2 text-secondary">{overtones.term}</p>
            </section>
            <StringModesDiagram content={overtones.modes} />
            <RealWorldExperiment title={overtones.guitar.title} withGuitar={overtones.guitar.withGuitar} withoutGuitar={overtones.guitar.withoutGuitar} safetyNote={overtones.guitar.safety} />
            <p className="rounded-lg border border-secondary bg-primary p-5 leading-6 text-secondary">{overtones.guitarResult}</p>
          </div>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('shape')}>{overtones.backLabel}</Button>
        {isCompleted('overtones') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('spectrum')}>{overtones.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'spectrum' && <div className="space-y-5">
      <LessonStep title={spectrum.title} intro={spectrum.instruction} shouldFocus={focusedStep === 'spectrum'}>
        <div className="space-y-6">
          <TimbreLab mode="spectrum" content={spectrum.lab} words={waveWords} sound={spectrumSound} start={timbrePresets.pluck} onChange={changeSpectrumSound} audio={audio} />
          {spectrumNamed && <>
            <section aria-labelledby="spectrum-term-title" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
              <h3 id="spectrum-term-title" className="font-semibold text-primary">{spectrum.termTitle}</h3>
              <p className="mt-2 text-secondary">{spectrum.term}</p>
            </section>
            <section aria-labelledby="spectrum-predictions-title" className="space-y-5">
              <div>
                <h3 id="spectrum-predictions-title" className="font-semibold text-primary">{spectrum.predictionsTitle}</h3>
                <p className="mt-1 text-sm text-tertiary">{spectrum.predictionsNote}</p>
              </div>
              <ol className="space-y-6">
                {spectrum.predictions.map((item) => <li key={item.id} className="space-y-3">
                  <ChoiceQuestion question={item.question} choices={item.choices} correctChoiceId={item.correctChoiceId} mode="prediction" onCheck={() => answerSpectrum(item.id)} />
                  {isSpectrumVerified(item.id)
                    ? <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-4 text-sm font-medium text-primary">{item.checked}</p>
                    : isSpectrumAnswered(item.id) && <p className="text-sm text-tertiary">{item.setupHint}</p>}
                </li>)}
              </ol>
            </section>
          </>}
          {isCompleted('spectrum') && <section aria-labelledby="spectrum-guitar-title" className="space-y-4">
            <h3 id="spectrum-guitar-title" className="font-semibold text-primary">{spectrum.guitarTitle}</h3>
            <p className="leading-6 text-secondary">{spectrum.guitarText}</p>
            <RealWorldExperiment title={spectrum.guitar.title} withGuitar={spectrum.guitar.withGuitar} withoutGuitar={spectrum.guitar.withoutGuitar} safetyNote={spectrum.guitar.safety} />
          </section>}
          <details className="rounded-lg border border-secondary bg-primary p-4 text-secondary">
            <summary className="min-h-11 cursor-pointer content-center font-semibold text-primary">{spectrum.deeper.summary}</summary>
            <div className="mt-3 space-y-2 text-sm leading-6">{spectrum.deeper.paragraphs.map((item) => <p key={item}>{item}</p>)}</div>
          </details>
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('overtones')}>{spectrum.backLabel}</Button>
      </div>
    </div>}
  </LessonShell>;
}
