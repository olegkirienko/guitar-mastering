import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { SameStringDiagram } from '@/components/lesson/same-string-diagram/same-string-diagram';
import { StringFactorExperiment } from '@/components/lesson/string-factor-experiment/string-factor-experiment';
import { StringPair } from '@/components/lesson/string-pair/string-pair';
import { StringHypotheses } from '@/components/lesson/string-hypotheses/string-hypotheses';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import { stopByStep } from '@/pages/lesson-three-page/constants';
import { useLessonThreePage } from '@/pages/lesson-three-page/hooks/use-lesson-three-page';

export function LessonThreePage() {
  const { route, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, hypotheses, toggleHypothesis, ownHypothesis, setOwnHypothesis, intro, length, tension, density, preferences, visibleStep, isCompleted, audio, goTo, begin, toggleAudio, completeLength, completeTension, completeDensity, tensionOpen, answerTension, densityOpen, answerDensity, audioMessage } = useLessonThreePage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonThreeContent} currentStop={stopByStep[visibleStep]} steps={route.steps} currentStepId={route.stepId}>
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
      <div className="rounded-lg border border-brand-200 bg-brand-25 p-5">
        <p className="text-lg font-medium text-primary">{intro.question}</p>
      </div>
      <div className="mt-6">
        <StringHypotheses content={intro} selected={hypotheses} onToggle={toggleHypothesis} own={ownHypothesis} onOwnChange={setOwnHypothesis} />
      </div>
      <div className="mt-6">
        <Button size="lg" iconTrailing={ArrowRight} onClick={begin}>{intro.startLabel}</Button>
      </div>
    </LessonStep>}

    {visibleStep === 'length' && <div className="space-y-5">
      <LessonStep title={length.title} intro={length.instruction} shouldFocus={focusedStep === 'length'}>
        <div className="space-y-5">
          <RealWorldExperiment title={length.guitar.title} withGuitar={length.guitar.withGuitar} withoutGuitar={length.guitar.withoutGuitar} safetyNote={length.guitar.safety} />
          <SameStringDiagram caption={length.diagram.caption} openLabel={length.diagram.openLabel} pressedLabel={length.diagram.pressedLabel} highlightVibrating />
          <StringFactorExperiment factor="length" prediction={length.prediction} content={length.experiment} audio={audio} completed={isCompleted('length')} onComplete={completeLength} />
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('intro')}>{length.backLabel}</Button>
        {isCompleted('length') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('tension')}>{length.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'tension' && <div className="space-y-5">
      <LessonStep title={tension.title} intro={tension.instruction} shouldFocus={focusedStep === 'tension'}>
        <div className="space-y-6">
          <StringPair caption={tension.pair.caption} strings={tension.pair.strings} pluckLabel={tension.pair.pluckLabel} audio={audio} />
          <ChoiceQuestion question={tension.question.question} choices={tension.question.choices} correctChoiceId={tension.question.correctChoiceId} onCheck={answerTension} />
          {tensionOpen && <>
            <RealWorldExperiment title={tension.guitar.title} withGuitar={tension.guitar.withGuitar} withoutGuitar={tension.guitar.withoutGuitar} safetyNote={tension.guitar.safety} />
            <StringFactorExperiment factor="tension" prediction={tension.prediction} content={tension.experiment} audio={audio} completed={isCompleted('tension')} onComplete={completeTension} />
          </>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('length')}>{tension.backLabel}</Button>
        {isCompleted('tension') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('density')}>{tension.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'density' && <div className="space-y-5">
      <LessonStep title={density.title} intro={density.instruction} shouldFocus={focusedStep === 'density'}>
        <div className="space-y-6">
          <RealWorldExperiment title={density.guitar.title} withGuitar={density.guitar.withGuitar} withoutGuitar={density.guitar.withoutGuitar} safetyNote={density.guitar.safety} />
          <StringPair caption={density.pair.caption} strings={density.pair.strings} pluckLabel={density.pair.pluckLabel} audio={audio} />
          <ChoiceQuestion question={density.problem.question} choices={density.problem.choices} correctChoiceId={density.problem.correctChoiceId} onCheck={answerDensity} />
          {densityOpen && <>
            <section aria-label={density.differences.title} className="space-y-3 rounded-lg border border-secondary bg-secondary p-5 text-secondary">
              <h3 className="font-semibold text-primary">{density.differences.title}</h3>
              <ul className="list-disc space-y-1 pl-5">{density.differences.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="font-medium text-primary">{density.differences.conclusion}</p>
            </section>
            <section aria-label={density.fairComparison.term} className="space-y-2 rounded-lg border border-brand-200 bg-brand-25 p-5 text-secondary">
              <p><strong className="text-primary">{density.fairComparison.term}</strong>{density.fairComparison.text}</p>
              <p>{density.fairComparison.synonym}</p>
            </section>
            <StringFactorExperiment factor="density" prediction={density.prediction} content={density.experiment} audio={audio} completed={isCompleted('density')} onComplete={completeDensity} />
          </>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('tension')}>{density.backLabel}</Button>
      </div>
    </div>}
  </LessonShell>;
}
