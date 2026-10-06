import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { StringFrequencyLab } from '@/components/lesson/string-frequency-lab/string-frequency-lab';
import { lessonFiveContent } from '@/data/lessons/stage-01-lesson-05/constants';
import { stopByStep } from '@/pages/lesson-five-page/constants';
import { useLessonFivePage } from '@/pages/lesson-five-page/hooks/use-lesson-five-page';

export function LessonFivePage() {
  const { route, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, intro, higher, lower, lab, preferences, visibleStep, isCompleted, audio, goTo, toggleAudio, startTasks, playIntroPluck, higherOpen, answerHigherPrediction, solveHigher, lowerOpen, answerLowerPrediction, solveLower, audioMessage } = useLessonFivePage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonFiveContent} currentStop={stopByStep[visibleStep]} steps={route.steps} currentStepId={route.stepId}>
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
        <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-lg font-medium text-primary">{intro.question}</p>
        <p className="text-secondary">{intro.note}</p>
        <section aria-labelledby="intro-tasks-title" className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
          <h3 id="intro-tasks-title" className="font-semibold text-primary">{intro.tasksTitle}</h3>
          <ol className="list-decimal space-y-2 pl-5 text-secondary">{intro.tasks.map((task) => <li key={task}>{task}</li>)}</ol>
          <p className="text-sm text-tertiary">{intro.tasksNote}</p>
        </section>
        <div className="space-y-3">
          <RealWorldExperiment title={intro.guitar.title} withGuitar={intro.guitar.withGuitar} withoutGuitar={intro.guitar.withoutGuitar} safetyNote={intro.guitar.safety} />
          {audio.enabled && <Button color="secondary" size="lg" onClick={playIntroPluck}>{intro.listenLabel}</Button>}
        </div>
        <Button size="lg" iconTrailing={ArrowRight} onClick={startTasks}>{intro.startLabel}</Button>
      </div>
    </LessonStep>}

    {visibleStep === 'higher' && <div className="space-y-5">
      <LessonStep title={higher.title} intro={higher.instruction} shouldFocus={focusedStep === 'higher'}>
        <div className="space-y-6">
          <ChoiceQuestion question={higher.prediction.question} choices={higher.prediction.choices} correctChoiceId={higher.prediction.correctChoiceId} mode="prediction" onCheck={answerHigherPrediction} />
          {higherOpen && <StringFrequencyLab content={lab} task={higher.task} audio={audio} completed={isCompleted('higher')} onComplete={solveHigher} />}
          {isCompleted('higher') && <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 font-medium text-primary">{higher.pattern}</p>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('intro')}>{higher.backLabel}</Button>
        {isCompleted('higher') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('lower')}>{higher.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'lower' && <div className="space-y-5">
      <LessonStep title={lower.title} intro={lower.instruction} shouldFocus={focusedStep === 'lower'}>
        <div className="space-y-6">
          <ChoiceQuestion question={lower.prediction.question} choices={lower.prediction.choices} correctChoiceId={lower.prediction.correctChoiceId} mode="prediction" onCheck={answerLowerPrediction} />
          {lowerOpen && <StringFrequencyLab content={lab} task={lower.task} audio={audio} completed={isCompleted('lower')} onComplete={solveLower} />}
          {isCompleted('lower') && <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 font-medium text-primary">{lower.pattern}</p>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('higher')}>{lower.backLabel}</Button>
        {isCompleted('lower') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('timbre')}>{lower.nextLabel}</Button>}
      </div>
    </div>}
  </LessonShell>;
}
