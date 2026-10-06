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
import { SoundPathCheckpoint } from '@/components/lesson/sound-path-checkpoint/sound-path-checkpoint';
import { StringFrequencyLab } from '@/components/lesson/string-frequency-lab/string-frequency-lab';
import { TimbreSoundComparison } from '@/components/lesson/timbre-sound-comparison/timbre-sound-comparison';
import { lessonFiveContent } from '@/data/lessons/stage-01-lesson-05/constants';
import { useLessonFivePage } from '@/pages/lesson-five-page/hooks/use-lesson-five-page';

export function LessonFivePage() {
  const { route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, intro, higher, lower, complete, lab, visibleStep, isCompleted, audio, goTo, toggleAudio, startTasks, playIntroPluck, finishStage, finishStatus, playBridge, higherOpen, answerHigherPrediction, solveHigher, lowerOpen, answerLowerPrediction, solveLower, timbre, path, answerTimbre, completePathChain, answerPath, pathQuestionsOpen, audioMessage } = useLessonFivePage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonFiveContent} steps={route.steps} currentStepId={route.stepId}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
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
          <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
        </div>
        <LessonStepNav next={{ label: intro.startLabel, onClick: startTasks }} />
      </div>
    </LessonStep>}

    {visibleStep === 'higher' && <div className="space-y-5">
      <LessonStep title={higher.title} intro={higher.instruction} shouldFocus={focusedStep === 'higher'}>
        <div className="space-y-6">
          <ChoiceQuestion question={higher.prediction.question} choices={higher.prediction.choices} correctChoiceId={higher.prediction.correctChoiceId} mode="prediction" onCheck={answerHigherPrediction} />
          {higherOpen && <StringFrequencyLab content={lab} task={higher.task} audio={audio} completed={isCompleted('higher')} onComplete={solveHigher} />}
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
          {isCompleted('higher') && <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 font-medium text-primary">{higher.pattern}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: higher.backLabel, onClick: () => goTo('intro') }} next={isCompleted('higher') ? { label: higher.nextLabel, onClick: () => goTo('lower') } : undefined} />
    </div>}

    {visibleStep === 'lower' && <div className="space-y-5">
      <LessonStep title={lower.title} intro={lower.instruction} shouldFocus={focusedStep === 'lower'}>
        <div className="space-y-6">
          <ChoiceQuestion question={lower.prediction.question} choices={lower.prediction.choices} correctChoiceId={lower.prediction.correctChoiceId} mode="prediction" onCheck={answerLowerPrediction} />
          {lowerOpen && <StringFrequencyLab content={lab} task={lower.task} audio={audio} completed={isCompleted('lower')} onComplete={solveLower} />}
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
          {isCompleted('lower') && <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 font-medium text-primary">{lower.pattern}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: lower.backLabel, onClick: () => goTo('higher') }} next={isCompleted('lower') ? { label: lower.nextLabel, onClick: () => goTo('timbre') } : undefined} />
    </div>}

    {visibleStep === 'timbre' && <div className="space-y-5">
      <LessonStep title={timbre.title} intro={timbre.instruction} shouldFocus={focusedStep === 'timbre'}>
        <div className="space-y-6">
          <RealWorldExperiment title={timbre.guitar.title} withGuitar={timbre.guitar.withGuitar} withoutGuitar={timbre.guitar.withoutGuitar} safetyNote={timbre.guitar.safety} />
          <div className="space-y-3">
            <TimbreSoundComparison content={timbre.comparison} audio={audio} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
            <p className="text-sm text-tertiary">{timbre.comparisonNote}</p>
          </div>
          <section aria-labelledby="timbre-questions-title" className="space-y-6">
            <h3 id="timbre-questions-title" className="font-semibold text-primary">{timbre.questionsTitle}</h3>
            {timbre.questions.map((item) => <ChoiceQuestion key={item.id} question={item.question} choices={item.choices} correctChoiceId={item.correctChoiceId} onCheck={(_, isCorrect) => answerTimbre(item.id, isCorrect)} />)}
          </section>
          {isCompleted('timbre') && <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 font-medium text-primary">{timbre.summary}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: timbre.backLabel, onClick: () => goTo('lower') }} next={isCompleted('timbre') ? { label: timbre.nextLabel, onClick: () => goTo('path') } : undefined} />
    </div>}

    {visibleStep === 'path' && <div className="space-y-5">
      <LessonStep title={path.title} intro={path.instruction} shouldFocus={focusedStep === 'path'}>
        <div className="space-y-6">
          <SoundPathCheckpoint content={path.checkpoint} initiallyPassed={isCompleted('path')} onComplete={completePathChain} />
          {pathQuestionsOpen && <section aria-labelledby="path-questions-title" className="space-y-6">
            <h3 id="path-questions-title" className="font-semibold text-primary">{path.questionsTitle}</h3>
            {path.questions.map((item) => <ChoiceQuestion key={item.id} question={item.question} choices={item.choices} correctChoiceId={item.correctChoiceId} onCheck={(_, isCorrect) => answerPath(item.id, isCorrect)} />)}
          </section>}
          {isCompleted('path') && <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 font-medium text-primary">{path.conclusion}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: path.backLabel, onClick: () => goTo('timbre') }} next={isCompleted('path') ? { label: path.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="lesson-five-chain" className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
            <h3 id="lesson-five-chain" className="font-semibold text-primary">{complete.chainTitle}</h3>
            <p className="text-lg font-medium text-primary">{complete.chain}</p>
            <ul className="space-y-2 text-secondary">
              {complete.rules.map((rule) => <li key={rule} className="flex gap-2"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />{rule}</li>)}
            </ul>
          </section>
          <section aria-labelledby="lesson-five-skills" className="space-y-3">
            <h3 id="lesson-five-skills" className="font-semibold text-primary">{complete.skillsTitle}</h3>
            <ul className="space-y-2 text-secondary">
              {complete.skills.map((skill) => <li key={skill} className="flex gap-2"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />{skill}</li>)}
            </ul>
          </section>
          {progress.completedAt === null && <Button size="lg" onClick={finishStage}>{complete.finishLabel}</Button>}
          <div ref={finishStatus} tabIndex={-1} role="status" data-testid="finish-status" className="space-y-3 outline-none">
            {progress.completedAt !== null && <>
              <p className="font-semibold text-primary">{complete.finished}</p>
              <p className="text-secondary">{complete.feedback}</p>
            </>}
          </div>
          {progress.completedAt !== null && <section aria-labelledby="lesson-five-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="lesson-five-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
            <p className="mt-2 text-lg font-medium text-primary">{complete.bridge}</p>
            <p className="mt-2 text-sm text-tertiary">{complete.bridgeNote}</p>
            {audio.enabled && <div className="mt-4 flex flex-wrap gap-3">
              {complete.bridgeSounds.map((item) => <Button key={item.id} color="secondary" size="lg" onClick={() => playBridge(item.frequency)}>{item.label}</Button>)}
            </div>}
          </section>}
          <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <LessonStepNav back={{ label: complete.backLabel, onClick: () => goTo('path') }} />
        {progress.completedAt !== null && <Button size="lg" href="/course">{complete.backToCourse}</Button>}
      </div>
    </div>}
  </LessonShell>;
}
