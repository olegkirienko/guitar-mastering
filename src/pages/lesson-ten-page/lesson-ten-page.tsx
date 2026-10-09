import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { CountLab } from '@/components/lesson/count-lab/count-lab';
import { GapsLab } from '@/components/lesson/gaps-lab/gaps-lab';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { OctaveLab } from '@/components/lesson/octave-lab/octave-lab';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { SemitoneWalkLab } from '@/components/lesson/semitone-walk-lab/semitone-walk-lab';
import { guitarOctaveHertz, guitarStringHertz, lessonTenContent } from '@/data/lessons/stage-02-lesson-05/constants';
import { toneGain, useLessonTenPage } from '@/pages/lesson-ten-page/hooks/use-lesson-ten-page';

const prediction = 'rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary';

export function LessonTenPage() {
  const { restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, visibleStep, isCompleted, completeStep, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus, predictionLabel, answerIntro } = useLessonTenPage();
  const { intro, octave, count, gaps, walk, guitar, complete } = lessonTenContent;
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  const toggle = <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />;
  const keys = { keyRowLabel: lessonTenContent.keyRowLabel, colors: lessonTenContent.colors, keyLabel: lessonTenContent.keyLabel };
  return <LessonShell {...lessonTenContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="space-y-6">
        <p className="text-secondary">{intro.instruction}</p>
        <section aria-labelledby="ten-tasks" className="space-y-3">
          <h3 id="ten-tasks" className="font-semibold text-primary">{intro.tasksTitle}</h3>
          <ol className="grid gap-3 sm:grid-cols-2">
            {intro.tasks.map((task) => <li key={task.title} className="rounded-lg border border-secondary bg-primary p-4">
              <p className="font-medium text-primary">{task.title}</p>
              <p className="mt-1 text-secondary">{task.text}</p>
            </li>)}
          </ol>
        </section>
        <ChoiceQuestion question={intro.prediction.question} choices={intro.prediction.choices} correctChoiceId={intro.prediction.correctChoiceId} mode="prediction" onCheck={answerIntro} />
        <LessonStepNav next={{ label: intro.nextLabel, onClick: () => advance('intro', 'octave') }} />
      </div>
    </LessonStep>}

    {visibleStep === 'octave' && <div className="space-y-5">
      <LessonStep title={octave.title} intro={octave.instruction} shouldFocus={focusedStep === 'octave'}>
        <div className="space-y-6">
          <OctaveLab content={octave} audio={audio} gain={toneGain} onSolved={() => completeStep('octave')} />
          {toggle}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: octave.backLabel, onClick: () => goTo('intro') }} next={isCompleted('octave') ? { label: octave.nextLabel, onClick: () => goTo('count') } : undefined} />
    </div>}

    {visibleStep === 'count' && <div className="space-y-5">
      <LessonStep title={count.title} intro={count.instruction} shouldFocus={focusedStep === 'count'}>
        <div className="space-y-6">
          <CountLab content={count} keys={keys} audio={audio} gain={toneGain} onSolved={() => completeStep('count')} />
          {toggle}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: count.backLabel, onClick: () => goTo('octave') }} next={isCompleted('count') ? { label: count.nextLabel, onClick: () => goTo('gaps') } : undefined} />
    </div>}

    {visibleStep === 'gaps' && <div className="space-y-5">
      <LessonStep title={gaps.title} intro={gaps.instruction} shouldFocus={focusedStep === 'gaps'}>
        <div className="space-y-6">
          <GapsLab content={gaps} keys={keys} audio={audio} gain={toneGain} onSolved={() => completeStep('gaps')} />
          {toggle}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: gaps.backLabel, onClick: () => goTo('count') }} next={isCompleted('gaps') ? { label: gaps.nextLabel, onClick: () => goTo('walk') } : undefined} />
    </div>}

    {visibleStep === 'walk' && <div className="space-y-5">
      <LessonStep title={walk.title} intro={walk.instruction} shouldFocus={focusedStep === 'walk'}>
        <div className="space-y-6">
          <SemitoneWalkLab content={walk} keys={keys} audio={audio} gain={toneGain} predictionLabel={predictionLabel} onSolved={() => completeStep('walk')} />
          {toggle}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: walk.backLabel, onClick: () => goTo('gaps') }} next={isCompleted('walk') ? { label: walk.nextLabel, onClick: () => goTo('guitar') } : undefined} />
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <div className="space-y-6">
          <RealWorldExperiment title={guitar.experiment.title} withGuitar={guitar.experiment.withGuitar} withoutGuitar={guitar.experiment.withoutGuitar} safetyNote={guitar.experiment.safety} />
          {audio.enabled && <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(guitarStringHertz)}>{guitar.listenString}</Button>
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(guitarOctaveHertz)}>{guitar.listenOctave}</Button>
          </div>}
          {toggle}
          <p className="text-lg font-medium text-primary">{guitar.question}</p>
          <p className="text-sm text-tertiary">{guitar.note}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: guitar.backLabel, onClick: () => goTo('walk') }} next={{ label: guitar.nextLabel, onClick: () => advance('guitar', 'complete') }} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="ten-summary" className="space-y-3">
            <h3 id="ten-summary" className="font-semibold text-primary">{complete.summaryTitle}</h3>
            <p className="text-secondary">{complete.chain}</p>
            <p className={prediction}>{complete.answer}</p>
          </section>
          <section aria-labelledby="ten-abilities" className="space-y-3">
            <h3 id="ten-abilities" className="font-semibold text-primary">{complete.abilitiesTitle}</h3>
            <ul className="space-y-2 text-secondary">
              {complete.abilities.map((ability) => <li key={ability} className="flex gap-2"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />{ability}</li>)}
            </ul>
          </section>
          {progress.completedAt === null && <Button size="lg" onClick={finishLesson}>{complete.finishLabel}</Button>}
          <div ref={finishStatus} tabIndex={-1} role="status" data-testid="finish-status" className="space-y-3 outline-none">
            {progress.completedAt !== null && <>
              <p className="font-semibold text-primary">{complete.finished}</p>
              <p className="text-secondary">{complete.feedback}</p>
            </>}
          </div>
          {progress.completedAt !== null && <section aria-labelledby="ten-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="ten-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
            <p className="mt-2 text-lg font-medium text-primary">{complete.bridge}</p>
            <p className="mt-2 text-sm text-tertiary">{complete.bridgeNote}</p>
          </section>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <LessonStepNav back={{ label: complete.backLabel, onClick: () => goTo('guitar') }} />
        {progress.completedAt !== null && <Button size="lg" href="/course">{complete.backToCourse}</Button>}
      </div>
    </div>}
  </LessonShell>;
}
