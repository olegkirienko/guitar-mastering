import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { SameStringDiagram } from '@/components/lesson/same-string-diagram/same-string-diagram';
import { StringFrequencyCheckpoint } from '@/components/lesson/string-frequency-checkpoint/string-frequency-checkpoint';
import { StringFactorExperiment } from '@/components/lesson/string-factor-experiment/string-factor-experiment';
import { StringFrequencyLab } from '@/components/lesson/string-frequency-lab/string-frequency-lab';
import { StringPair } from '@/components/lesson/string-pair/string-pair';
import { StringHypotheses } from '@/components/lesson/string-hypotheses/string-hypotheses';
import { StringHypothesesSummary } from '@/components/lesson/string-hypotheses-summary/string-hypotheses-summary';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import { useLessonThreePage } from '@/pages/lesson-three-page/hooks/use-lesson-three-page';

export function LessonThreePage() {
  const { restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, hypotheses, toggleHypothesis, ownHypothesis, setOwnHypothesis, finishStatus, intro, length, tension, density, model, checkpoint, complete, visibleStep, isCompleted, audio, goTo, begin, toggleAudio, completeLength, completeTension, completeDensity, completeModel, passCheckpoint, finishLesson, tensionOpen, answerTension, densityOpen, answerDensity, audioMessage } = useLessonThreePage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonThreeContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
        <p className="text-lg font-medium text-primary">{intro.question}</p>
      </div>
      <div className="mt-6">
        <StringHypotheses content={intro} selected={hypotheses} onToggle={toggleHypothesis} own={ownHypothesis} onOwnChange={setOwnHypothesis} />
      </div>
      <div className="mt-6">
        <LessonStepNav next={{ label: intro.startLabel, onClick: begin }} />
      </div>
    </LessonStep>}

    {visibleStep === 'length' && <div className="space-y-5">
      <LessonStep title={length.title} intro={length.instruction} shouldFocus={focusedStep === 'length'}>
        <div className="space-y-5">
          <RealWorldExperiment title={length.guitar.title} withGuitar={length.guitar.withGuitar} withoutGuitar={length.guitar.withoutGuitar} safetyNote={length.guitar.safety} />
          <SameStringDiagram caption={length.diagram.caption} openLabel={length.diagram.openLabel} pressedLabel={length.diagram.pressedLabel} highlightVibrating />
          <StringFactorExperiment factor="length" prediction={length.prediction} content={length.experiment} audio={audio} completed={isCompleted('length')} onComplete={completeLength} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: length.backLabel, onClick: () => goTo('intro') }} next={isCompleted('length') ? { label: length.nextLabel, onClick: () => goTo('tension') } : undefined} />
    </div>}

    {visibleStep === 'tension' && <div className="space-y-5">
      <LessonStep title={tension.title} intro={tension.instruction} shouldFocus={focusedStep === 'tension'}>
        <div className="space-y-6">
          <StringPair caption={tension.pair.caption} strings={tension.pair.strings} pluckLabel={tension.pair.pluckLabel} audio={audio} />
          <ChoiceQuestion question={tension.question.question} choices={tension.question.choices} correctChoiceId={tension.question.correctChoiceId} onCheck={answerTension} />
          {tensionOpen && <>
            <RealWorldExperiment title={tension.guitar.title} withGuitar={tension.guitar.withGuitar} withoutGuitar={tension.guitar.withoutGuitar} safetyNote={tension.guitar.safety} />
            <StringFactorExperiment factor="tension" prediction={tension.prediction} content={tension.experiment} audio={audio} completed={isCompleted('tension')} onComplete={completeTension} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
          </>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: tension.backLabel, onClick: () => goTo('length') }} next={isCompleted('tension') ? { label: tension.nextLabel, onClick: () => goTo('density') } : undefined} />
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
            <section aria-label={density.fairComparison.term} className="space-y-2 rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">
              <p><strong className="text-primary">{density.fairComparison.term}</strong>{density.fairComparison.text}</p>
              <p>{density.fairComparison.synonym}</p>
            </section>
            <StringFactorExperiment factor="density" prediction={density.prediction} content={density.experiment} audio={audio} completed={isCompleted('density')} onComplete={completeDensity} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
          </>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: density.backLabel, onClick: () => goTo('tension') }} next={isCompleted('density') ? { label: density.nextLabel, onClick: () => goTo('model') } : undefined} />
    </div>}

    {visibleStep === 'model' && <div className="space-y-5">
      <LessonStep title={model.title} intro={model.instruction} shouldFocus={focusedStep === 'model'}>
        <div className="space-y-6">
          <StringFrequencyLab content={model.lab} predictions={model.predictions} audio={audio} completed={isCompleted('model')} onComplete={completeModel} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
          <details className="rounded-lg border border-secondary bg-primary p-4 text-secondary">
            <summary className="min-h-11 cursor-pointer content-center font-semibold text-primary">{model.deeper.summary}</summary>
            <p className="mt-3 text-lg font-semibold text-primary">{model.deeper.formula}</p>
            <ul className="mt-2 space-y-1 text-sm">{model.deeper.legend.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="mt-4 text-sm font-medium text-primary">{model.deeper.consequencesTitle}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{model.deeper.consequences.map((item) => <li key={item}>{item}</li>)}</ul>
          </details>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: model.backLabel, onClick: () => goTo('density') }} next={isCompleted('model') ? { label: model.nextLabel, onClick: () => goTo('checkpoint') } : undefined} />
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <StringFrequencyCheckpoint content={checkpoint} lab={model.lab} audio={audio} passed={progress.checkpointPassed} onPass={passCheckpoint} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
      </LessonStep>
      <LessonStepNav back={{ label: checkpoint.backLabel, onClick: () => goTo('model') }} next={progress.checkpointPassed ? { label: checkpoint.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="lesson-three-rules" className="space-y-3">
            <h3 id="lesson-three-rules" className="font-semibold text-primary">{complete.rulesTitle}</h3>
            <ul className="space-y-2 text-secondary">
              {Object.values(model.lab.rules).map((rule) => <li key={rule} className="flex gap-2"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />{rule}</li>)}
            </ul>
            <p className="rounded-lg bg-secondary p-4 text-sm font-medium text-primary">{complete.fairComparison}</p>
          </section>
          <StringHypothesesSummary intro={intro} content={complete} selected={hypotheses} own={ownHypothesis} />
          {progress.completedAt === null && <Button size="lg" onClick={finishLesson}>{complete.finishLabel}</Button>}
          <div ref={finishStatus} tabIndex={-1} role="status" data-testid="finish-status" className="space-y-3 outline-none">
            {progress.completedAt !== null && <>
              <p className="font-semibold text-primary">{complete.finished}</p>
              <p className="text-secondary">{complete.feedback}</p>
            </>}
          </div>
          {progress.completedAt !== null && <section aria-labelledby="lesson-three-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="lesson-three-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
            <p className="mt-2 text-lg font-medium text-primary">{complete.bridge}</p>
            <p className="mt-2 text-sm text-tertiary">{complete.bridgeNote}</p>
          </section>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <LessonStepNav back={{ label: complete.backLabel, onClick: () => goTo('checkpoint') }} />
        {progress.completedAt !== null && <Button size="lg" href="/">{complete.backToCourse}</Button>}
      </div>
    </div>}
  </LessonShell>;
}
