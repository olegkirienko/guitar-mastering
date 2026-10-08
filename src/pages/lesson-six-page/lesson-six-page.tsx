import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { OctaveCheckpoint } from '@/components/lesson/octave-checkpoint/octave-checkpoint';
import { OctaveDoubler } from '@/components/lesson/octave-doubler/octave-doubler';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { lessonSixContent, sameNameFrequencies } from '@/data/lessons/stage-02-lesson-01/constants';
import { toneGain, useLessonSixPage } from '@/pages/lesson-six-page/hooks/use-lesson-six-page';

export function LessonSixPage() {
  const { restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus, betweenFound, findBetween, answerSameName, sameNamePredicted, listen, isHeard, sameNameDone, passCheckpoint, finishDoubler, answerOctave } = useLessonSixPage();
  const { intro, sameName, doubler, octave, guitar, checkpoint, complete } = lessonSixContent;
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  const toggle = <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />;
  return <LessonShell {...lessonSixContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="space-y-6">
        <p className="text-lg font-medium text-primary">{intro.question}</p>
        <section className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
          <p className="text-secondary">{intro.listenNote}</p>
          {audio.enabled && <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={() => audio.playTone(440, toneGain)}>{intro.listenLabels.first}</Button>
            <Button color="secondary" size="lg" onClick={() => audio.playTone(441, toneGain)}>{intro.listenLabels.second}</Button>
          </div>}
        </section>
        {toggle}
        <section aria-labelledby="six-intro-between" className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
          <h3 id="six-intro-between" className="font-semibold text-primary">{intro.between.title}</h3>
          <p className="text-secondary">{intro.between.instruction}</p>
          <ol className="space-y-1 text-secondary" role="status" aria-live="polite">
            {intro.between.values.slice(0, betweenFound).map((value) => <li key={value}>{intro.between.found} <strong className="text-primary">{value} {intro.between.unitLabel}</strong></li>)}
          </ol>
          {betweenFound < intro.between.values.length
            ? <Button color="secondary" size="lg" onClick={findBetween}>{intro.between.stepLabel}</Button>
            : <p className="font-medium text-primary">{intro.between.always}</p>}
        </section>
        {(betweenFound > 0 || isCompleted('intro')) && <>
          <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{intro.discovery}</p>
          <p className="text-sm text-tertiary">{intro.systemNote}</p>
          <p className="text-lg font-medium text-primary">{intro.nextQuestion}</p>
          <LessonStepNav next={{ label: intro.nextLabel, onClick: () => advance('intro', 'same-name') }} />
        </>}
      </div>
    </LessonStep>}

    {visibleStep === 'same-name' && <div className="space-y-5">
      <LessonStep title={sameName.title} intro={sameName.instruction} shouldFocus={focusedStep === 'same-name'}>
        <div className="space-y-6">
          <ChoiceQuestion question={sameName.prediction.question} choices={sameName.prediction.choices} correctChoiceId={sameName.prediction.correctChoiceId} mode="prediction" onCheck={answerSameName} />
          {sameNamePredicted && <section aria-labelledby="six-cards" className="space-y-3">
            <h3 id="six-cards" className="font-semibold text-primary">{sameName.cardsTitle}</h3>
            {audio.enabled
              ? <ul className="flex flex-wrap gap-3">
                {sameNameFrequencies.map((frequency) => <li key={frequency} className="flex items-center gap-2">
                  <Button color="secondary" size="lg" onClick={() => listen(frequency)}>{sameName.cardLabel(frequency)}</Button>
                  {isHeard(frequency) && <CheckCircle className="size-5 text-success-600" aria-label={sameName.heardLabel} />}
                </li>)}
              </ul>
              : <p className="text-secondary">{sameName.cardNote}</p>}
            {toggle}
          </section>}
          {sameNameDone && <div className="space-y-3" role="status">
            <p className="font-medium text-primary">{sameName.result}</p>
            <p className="text-lg font-medium text-primary">{sameName.pattern}</p>
          </div>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: sameName.backLabel, onClick: () => goTo('intro') }} next={sameNameDone ? { label: sameName.nextLabel, onClick: () => advance('same-name', 'doubler') } : undefined} />
    </div>}

    {visibleStep === 'doubler' && <div className="space-y-5">
      <LessonStep title={doubler.title} intro={doubler.instruction} shouldFocus={focusedStep === 'doubler'}>
        <div className="space-y-6">
          <OctaveDoubler content={doubler} audio={audio} gain={toneGain} completed={isCompleted('doubler')} onDone={finishDoubler} />
          {toggle}
          {isCompleted('doubler') && <p className="text-lg font-medium text-primary">{doubler.nextQuestion}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: doubler.backLabel, onClick: () => goTo('same-name') }} next={isCompleted('doubler') ? { label: doubler.nextLabel, onClick: () => goTo('octave') } : undefined} />
    </div>}

    {visibleStep === 'octave' && <div className="space-y-5">
      <LessonStep title={octave.title} intro={octave.instruction} shouldFocus={focusedStep === 'octave'}>
        <div className="space-y-6">
          <section aria-labelledby="six-octave-seen" className="space-y-2 rounded-lg border border-secondary bg-primary p-5">
            <h3 id="six-octave-seen" className="font-semibold text-primary">{octave.chainTitle}</h3>
            <p className="text-2xl font-semibold tabular-nums text-primary">{octave.equation}</p>
            <p className="text-secondary">{octave.rule}</p>
          </section>
          <section aria-labelledby="six-octave-term" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="six-octave-term" className="font-semibold text-primary">{octave.termTitle}</h3>
            <p className="mt-2 text-secondary">{octave.term}</p>
          </section>
          <p className="text-sm text-tertiary">{octave.systemNote}</p>
          <ChoiceQuestion question={octave.question.question} choices={octave.question.choices} correctChoiceId={octave.question.correctChoiceId} onCheck={answerOctave} />
          {isCompleted('octave') && <p className="text-lg font-medium text-primary">{octave.bridge}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: octave.backLabel, onClick: () => goTo('doubler') }} next={isCompleted('octave') ? { label: octave.nextLabel, onClick: () => goTo('guitar') } : undefined} />
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <div className="space-y-6">
          <RealWorldExperiment title={guitar.experiment.title} withGuitar={guitar.experiment.withGuitar} withoutGuitar={guitar.experiment.withoutGuitar} safetyNote={guitar.experiment.safety} />
          {audio.enabled && <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(110)}>{guitar.listenLow}</Button>
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(220)}>{guitar.listenHigh}</Button>
          </div>}
          {toggle}
          <p className="text-lg font-medium text-primary">{guitar.question}</p>
          <p className="text-sm text-tertiary">{guitar.note}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: guitar.backLabel, onClick: () => goTo('octave') }} next={{ label: guitar.nextLabel, onClick: () => advance('guitar', 'checkpoint') }} />
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <div className="space-y-6">
          <OctaveCheckpoint content={checkpoint} audio={audio} gain={toneGain} passed={progress.checkpointPassed} onPass={passCheckpoint} />
          {toggle}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: checkpoint.backLabel, onClick: () => goTo('guitar') }} next={progress.checkpointPassed ? { label: checkpoint.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="six-summary" className="space-y-3">
            <h3 id="six-summary" className="font-semibold text-primary">{complete.summaryTitle}</h3>
            <ul className="space-y-2 text-secondary">
              {complete.summary.map((rule) => <li key={rule} className="flex gap-2"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />{rule}</li>)}
            </ul>
          </section>
          {progress.completedAt === null && <Button size="lg" onClick={finishLesson}>{complete.finishLabel}</Button>}
          <div ref={finishStatus} tabIndex={-1} role="status" data-testid="finish-status" className="space-y-3 outline-none">
            {progress.completedAt !== null && <>
              <p className="font-semibold text-primary">{complete.finished}</p>
              <p className="text-secondary">{complete.feedback}</p>
            </>}
          </div>
          {progress.completedAt !== null && <section aria-labelledby="six-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="six-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
            <p className="mt-2 text-lg font-medium text-primary">{complete.bridge}</p>
            <p className="mt-2 text-sm text-tertiary">{complete.bridgeNote}</p>
          </section>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <LessonStepNav back={{ label: complete.backLabel, onClick: () => goTo('checkpoint') }} />
        {progress.completedAt !== null && <Button size="lg" href="/course">{complete.backToCourse}</Button>}
      </div>
    </div>}
  </LessonShell>;
}
